import {handheldLayout, portableInput} from './deviceLayout.js';

const positive = value => Number.isFinite(value) && value > 0;
const pixel = value => Math.round(value);
const installations = new WeakMap();

function isTextField(node) {
  return node?.isContentEditable || node?.matches?.('textarea,input:not([type]),input:is([type=text],[type=search],[type=email],[type=url],[type=tel],[type=number],[type=password])');
}

/** One frame owns classification, the visible rectangle and notification of its consumers. */
export function installViewport(win=window, doc=document) {
  if (installations.has(doc)) return installations.get(doc);
  const root = doc.documentElement;
  const visual = win.visualViewport;
  const pointer = win.matchMedia?.('(pointer: coarse)');
  const app = doc.getElementById?.('app');
  const listeners = [];
  let frame = 0, previous, lastUnfocused, zoomed = false;

  function applyLayoutMode(portable, handheld) {
    if (root.dataset.portable !== String(portable)) root.dataset.portable = String(portable);
    if (root.dataset.handheld !== String(handheld)) root.dataset.handheld = String(handheld);
  }
  function update() {
    frame = 0;
    if (doc.hidden) return;
    const layoutWidth = root.clientWidth || win.innerWidth;
    const layoutHeight = root.clientHeight || win.innerHeight;
    if (!positive(layoutWidth) || !positive(layoutHeight)) return;

    const portable = portableInput(win);
    const editing = !!isTextField(doc.activeElement);
    if (!editing || !lastUnfocused || lastUnfocused.width !== layoutWidth) {
      lastUnfocused = {width: layoutWidth, height: layoutHeight};
    }
    const handheld = portable && handheldLayout({
      touchPoints: win.navigator.maxTouchPoints, coarse: true,
      width: layoutWidth, height: lastUnfocused.height
    });
    // Classify from the layout viewport even when a former desktop minimum width
    // has caused the browser to zoom out during rotation.
    if (visual && (!positive(visual.scale) || !positive(visual.width) || !positive(visual.height))) return;
    if (visual && Math.abs(visual.scale - 1) >= .02) {
      if (!zoomed) doc.dispatchEvent(new Event('atlas:cancel-drag'));
      applyLayoutMode(portable,handheld);
      zoomed = true;
      return; // Leave native zoom and panning in control of the existing layout.
    }

    const width = pixel(Math.min(layoutWidth, visual?.width ?? layoutWidth));
    const height = pixel(visual?.height ?? win.innerHeight);
    if (!positive(width) || !positive(height) ||
        (visual && (!Number.isFinite(visual.offsetTop) || !Number.isFinite(visual.offsetLeft)))) return;
    const top = pixel(Math.max(0, visual?.offsetTop || 0));
    const left = pixel(Math.max(0, visual?.offsetLeft || 0));
    const host = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
    const keyboard = portable && editing && lastUnfocused.height - height > 80;
    const orientation = win.screen?.orientation?.type || '';
    const key = [width,height,top,left,handheld,portable,orientation,app?.scrollTop,app?.scrollLeft].join('/');
    const reposition = !previous || key !== previous.key || host !== previous.host || zoomed;
    zoomed = false;
    if (!reposition && previous.keyboard === keyboard) return;
    if (previous && reposition) doc.dispatchEvent(new Event('atlas:cancel-drag'));
    applyLayoutMode(portable,handheld);

    if (reposition) {
      root.style.setProperty('--visual-width', width + 'px');
      root.style.setProperty('--visual-height', !visual && win.CSS?.supports('height','100dvh') ? '100dvh' : height + 'px');
      root.style.setProperty('--visual-top', top + 'px');
      root.style.setProperty('--visual-left', left + 'px');
      root.dataset.shortViewport = String(height < 430);
      root.dataset.compactHeight = String(height < 640);
    }
    root.dataset.keyboard = String(keyboard);
    previous = {key, host, keyboard};
    doc.dispatchEvent(new Event('atlas:viewport'));
  }
  function schedule() {
    if (!frame) frame = win.requestAnimationFrame(update);
  }
  function listen(target, names) {
    if (!target?.addEventListener) return;
    for (const name of names) {
      target.addEventListener(name, schedule);
      listeners.push([target, name]);
    }
  }
  listen(win, ['resize','orientationchange','pageshow']);
  listen(visual, ['resize','scroll']);
  listen(app, ['scroll']);
  listen(win.screen?.orientation, ['change']);
  listen(pointer, ['change']);
  listen(doc, ['fullscreenchange','webkitfullscreenchange','fullscreenerror','visibilitychange','focusin','focusout']);
  update();
  const dispose = () => {
    for (const [target,name] of listeners) target.removeEventListener(name, schedule);
    if (frame) win.cancelAnimationFrame(frame);
    installations.delete(doc);
  };
  installations.set(doc, dispose);
  return dispose;
}
