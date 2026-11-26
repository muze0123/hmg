/** Same inline-image contract as OpenData's shared rich editor; no image-upload API is configured. */
export const RICH_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
export const RICH_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export function isRichImage(file: File): boolean {
  return (RICH_IMAGE_TYPES as readonly string[]).includes(file.type);
}
export function readRichImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read the image'));
    reader.onabort = () => reject(new Error('Image read cancelled'));
    reader.readAsDataURL(file);
  });
}

/** Allowlisted HTML for execution values; persisted or pasted HTML is never trusted. */
export function safeRichHtml(raw: string): string {
  const source = document.createElement('template');
  source.innerHTML = raw;
  const allowed = new Set(['P','BR','DIV','SPAN','STRONG','B','EM','I','U','S','DEL','UL','OL','LI','BLOCKQUOTE','PRE','CODE','H1','H2','H3','H4','H5','H6','A','IMG','TABLE','THEAD','TBODY','TR','TH','TD','HR']);
  const drop = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON']);
  function clean(node: Node): Node | undefined {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (!(node instanceof HTMLElement) || drop.has(node.tagName)) return;
    const result = document.createElement(allowed.has(node.tagName) ? node.tagName.toLowerCase() : 'span');
    if (node.tagName === 'A' || node.tagName === 'IMG') {
      const attr = node.tagName === 'A' ? 'href' : 'src'; const value = node.getAttribute(attr) || '';
      if (/^https?:\/\//i.test(value) || (attr === 'href' && /^mailto:/i.test(value)) || (attr === 'src' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(value))) result.setAttribute(attr,value);
      if (attr === 'href') { result.setAttribute('target','_blank'); result.setAttribute('rel','noopener noreferrer'); }
      if (attr === 'src') result.setAttribute('alt',node.getAttribute('alt') || '');
    }
    for (const name of ['colspan','rowspan']) if (/^\d{1,2}$/.test(node.getAttribute(name) || '')) result.setAttribute(name,node.getAttribute(name)!);
    for (const name of ['text-align','font-size','font-family','font-weight','font-style','text-decoration','color','background-color','text-indent']) {
      const value = node.style.getPropertyValue(name);
      if (value && !/url|expression|var\(|[<>\\]/i.test(value)) result.style.setProperty(name,value);
    }
    for (const child of Array.from(node.childNodes)) { const safe = clean(child); if (safe) result.appendChild(safe); }
    return result;
  }
  const target = document.createElement('div');
  for (const child of Array.from(source.content.childNodes)) { const safe = clean(child); if (safe) target.appendChild(safe); }
  return target.innerHTML;
}
export function richHasContent(value: string): boolean {
  const host = document.createElement('div'); host.innerHTML = safeRichHtml(value);
  return !!host.textContent?.replace(/[\s\u200B-\u200D\uFEFF]/g,'') || !!host.querySelector('img[src]');
}

export function richImageCount(value: string): number {
  const host = document.createElement('template');
  host.innerHTML = safeRichHtml(value);
  return host.content.querySelectorAll('img[src]').length;
}
