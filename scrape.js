import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const urls = [
  { path: '/', file: 'index.html' },
  { path: '/mentorship', file: 'mentorship.html' },
  { path: '/results', file: 'results.html' },
  { path: '/community', file: 'community.html' },
  { path: '/events', file: 'events.html' },
];

const BASE_URL = 'http://localhost:5000';
const OUT_DIR = path.resolve('./public_html');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Function to copy assets
function copyAssets() {
  const distDir = path.resolve('./dist/public/assets');
  const outAssetsDir = path.join(OUT_DIR, 'assets');
  
  if (!fs.existsSync(outAssetsDir)) {
    fs.mkdirSync(outAssetsDir, { recursive: true });
  }

  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
      fs.copyFileSync(
        path.join(distDir, file),
        path.join(outAssetsDir, file)
      );
    });
    console.log('Assets copied successfully.');
  } else {
    console.log('Warning: No assets folder found in dist/public');
  }
}

async function scrape() {
  console.log('Starting static export...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });
  
  const page = await browser.newPage();
  
  for (const { path: routePath, file } of urls) {
    console.log(`Scraping ${routePath}...`);
    await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'networkidle0' });
    
    // Extract CSS and JS filenames from the dist folder
    const distAssets = fs.existsSync(path.resolve('./dist/public/assets')) 
      ? fs.readdirSync(path.resolve('./dist/public/assets')) 
      : [];
      
    const cssFile = distAssets.find(f => f.endsWith('.css'));
    const jsFile = distAssets.find(f => f.endsWith('.js'));
    
    // Get the HTML content
    const htmlHandle = await page.evaluateHandle(() => document.documentElement.outerHTML);
    let html = await htmlHandle.jsonValue();
    
    // Clean up Vite/React injected scripts
    html = html.replace(/<script type="module" src="\/@vite\/client"><\/script>/g, '');
    html = html.replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/g, '');
    html = html.replace(/<script>.*?window\.__vite_plugin_react_preamble_installed__.*?<\/script>/gs, '');
    
    // Remove all development inline scripts that got injected (like React Refresh, etc)
    html = html.replace(/<script type="module">.*?<\/script>/gs, '');
    html = html.replace(/<script>.*?<\/script>/gs, '');

    // Add production CSS and JS links if available
    if (cssFile) {
        html = html.replace('</head>', `  <link rel="stylesheet" href="./assets/${cssFile}">\n</head>`);
    }
    
    if (jsFile) {
        // Adding type module for the bundled JS
        html = html.replace('</body>', `  <script type="module" src="./assets/${jsFile}"></script>\n</body>`);
    }

    // Fix absolute asset paths from the dev server to relative paths
    html = html.replace(/\/src\/assets\//g, './assets/');

    fs.writeFileSync(path.join(OUT_DIR, file), `<!DOCTYPE html>\n<html lang="en">\n${html}\n</html>`);
    console.log(`Saved to ${file}`);
  }

  await browser.close();
  copyAssets();
  
  // Copy public static files if any
  const publicDir = path.resolve('./public');
  if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      files.forEach(file => {
          if (fs.statSync(path.join(publicDir, file)).isFile()) {
              fs.copyFileSync(
                  path.join(publicDir, file),
                  path.join(OUT_DIR, file)
              );
          }
      });
  }
  
  console.log('Static site generation complete! Files are in /public_html');
}

scrape().catch(console.error);