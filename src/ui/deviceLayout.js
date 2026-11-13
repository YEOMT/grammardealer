/** Phone layout is a device/window decision, independent of browser bars and the keyboard. */
export function handheldLayout({touchPoints=0,coarse=false,mobile=false,width,height}) {
  return touchPoints > 0 && (coarse || mobile) && Math.min(width,height) <= 600 && Math.max(width,height) <= 1000;
}

export function portableInput(win) {
  return win.navigator?.maxTouchPoints > 0 &&
    (win.matchMedia?.('(pointer: coarse)').matches || /Android|iPhone|iPad|Mobile/i.test(win.navigator.userAgent));
}
