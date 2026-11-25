/** Twelve tablet columns need a 1024px layout viewport. Narrow touch windows
 * reuse the existing eight-column view; visual height never changes this choice. */
export function handheldLayout({touchPoints=0,coarse=false,mobile=false,width}) {
  return touchPoints > 0 && (coarse || mobile) && width > 0 && width < 1024;
}

export function portableInput(win) {
  return win.navigator?.maxTouchPoints > 0 &&
    (win.matchMedia?.('(pointer: coarse)').matches || win.matchMedia?.('(any-pointer: coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(win.navigator.userAgent));
}
