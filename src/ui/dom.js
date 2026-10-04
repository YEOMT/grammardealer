/** Safe small DOM helpers; all dynamic labels use textContent. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key in node && key !== 'role') node[key] = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) if (child != null && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
export const button = (label, action, className = '', props = {}) => el('button', { type: 'button', class: className, text: label, onclick: action, ...props });
export function heading(eyebrow, title, description = '') {
  return el('div', { class: 'section-heading' }, el('span', { class: 'eyebrow', text: eyebrow }), el('h2', { text: title }), description && el('p', { text: description }));
}
let toastTimer;
export function toast(message) {
  let node = document.querySelector('#toast');
  if (!node) { node = el('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(node); }
  node.textContent = message; node.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('visible'), 3600);
}
export function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = el('a', { href: url, download: filename }); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function modal(title, content, { wide = false, onClose, closeable = true } = {}) {
  document.querySelectorAll('dialog.app-dialog').forEach(d => d.close());
  const dialog = el('dialog', { class: `app-dialog ${wide ? 'wide' : ''}` });
  const close = () => dialog.close();
  const header = el('header', { class: 'dialog-header' }, el('h2', { text: title }), closeable && button('닫기 ×', close, 'quiet', { 'aria-label': `${title} 닫기` }));
  dialog.append(header, el('div', { class: 'dialog-body' }, content));
  if (!closeable) dialog.addEventListener('cancel', e => e.preventDefault());
  const previousFocus = document.activeElement;
  dialog.addEventListener('close', () => { dialog.remove(); onClose?.(); if (previousFocus?.isConnected) previousFocus.focus(); });
  document.body.append(dialog); dialog.showModal();
  return { dialog, close, content: dialog.querySelector('.dialog-body') };
}
export function confirmDialog(title, message, confirmLabel, action) {
  let view;
  view = modal(title, [el('p', { class: 'body-copy', text: message }), el('div', { class: 'dialog-actions' }, button('취소', () => view.close(), 'secondary'), button(confirmLabel, async () => { view.close(); await action(); }, 'primary'))]);
}
