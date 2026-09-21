import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Use this whenever rendering user-authored or database-sourced HTML
 * via dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    // Allow standard formatting tags used by the rich text editor (Quill)
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
      'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code', 'span', 'div', 'sub', 'sup', 'table',
      'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'class', 'style', 'colspan', 'rowspan',
    ],
    // Force links to open safely
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
