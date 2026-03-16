import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 animate-section">
        <div className="max-w-3xl mx-auto">
          {/* Back Navigation */}
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-primary transition-colors mb-12 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </a>
          </Link>

          {/* Header */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-6">
              Privacy Policy
            </h1>
            <div className="w-20 h-1 bg-primary rounded-full"></div>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-headings:font-heading prose-headings:font-normal prose-p:text-foreground/80 prose-p:leading-relaxed prose-a:text-primary hover:prose-a:text-primary/80 prose-li:text-foreground/80 max-w-none">
            
            <p className="text-xl font-medium text-foreground mb-8">
              At Designforge, we respect your privacy.
            </p>

            <p>
              When you fill out a form, contact us, or join a program, we may collect details like your name, email address, phone number, and other basic information you choose to share.
            </p>

            <p className="mt-8 mb-4 font-medium text-foreground">We use this information only to:</p>
            <ul className="space-y-3 mb-8 bg-white/50 p-6 md:p-8 rounded-2xl border border-black/5">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                <span>respond to your queries</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                <span>manage registrations, applications, or participation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                <span>share updates about programs, workshops, and community activities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0"></span>
                <span>improve our website and learning experience</span>
              </li>
            </ul>

            <div className="my-12 p-8 rounded-2xl bg-primary/5 border border-primary/10 text-center">
              <p className="text-xl md:text-2xl font-heading text-primary m-0">
                We do not sell your personal information.
              </p>
            </div>

            <p>
              We take reasonable steps to keep your information safe, but no online platform can guarantee complete security.
            </p>

            <p>
              Our website may sometimes include links to external platforms. We are not responsible for the privacy practices of those websites.
            </p>

            <p className="mt-12 font-medium text-foreground">
              By using this website, you agree to this privacy policy.
            </p>

            <div className="mt-16 pt-8 border-t border-black/10">
              <p className="text-sm text-foreground/60 uppercase tracking-wider font-semibold mb-2">Contact Us</p>
              <a href="mailto:designforge05@gmail.com" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                designforge05@gmail.com
              </a>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
