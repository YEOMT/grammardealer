import {button, el, toast} from './dom.js';

const pending = new WeakMap();
let closeHelp;
let startAttempted = false;
let showedRestriction = false;

export function lobbyAddress(origin='https://yeomt.github.io/grammardealer/', base='./') {
  const url = new URL(base, origin);
  url.search = '';
  url.hash = 'lobby';
  return url.href;
}

function fullscreenHost(doc) {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function displayMode(win) {
  if (win.matchMedia('(display-mode: standalone)').matches || win.navigator.standalone) return 'standalone';
  if (win.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  return 'browser';
}

// Older WebKit can return void and publish its fullscreen element in a later event.
function requestWebKitFullscreen(doc) {
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      doc.removeEventListener('webkitfullscreenchange', finish);
      doc.removeEventListener('webkitfullscreenerror', finish);
      resolve();
    };
    doc.addEventListener('webkitfullscreenchange', finish);
    doc.addEventListener('webkitfullscreenerror', finish);
    const timer = setTimeout(finish, 1500);
    try {
      const result = doc.documentElement.webkitRequestFullscreen();
      if (fullscreenHost(doc)) finish();
      else result?.then(finish,finish);
    } catch { finish(); }
  });
}

/** Called directly in the activating handler. Orientation is a separate, best-effort request. */
export function enterLandscape(win=window, doc=document) {
  if (pending.has(doc)) return pending.get(doc);
  const request = async () => {
    if (!fullscreenHost(doc)) {
      const root = doc.documentElement;
      const legacy = !('fullscreenEnabled' in doc) && !root.requestFullscreen;
      const enabled = legacy ? doc.webkitFullscreenEnabled : doc.fullscreenEnabled;
      const enter = legacy ? root.webkitRequestFullscreen : root.requestFullscreen;
      if (enabled === false || typeof enter !== 'function') return 'unavailable';
      try {
        if (legacy) await requestWebKitFullscreen(doc);
        else await enter.call(root);
      } catch {
        return 'denied';
      }
      if (!fullscreenHost(doc)) return 'unavailable';
    }
    try {
      await win.screen.orientation?.lock?.('landscape');
    } catch {
      // The browser can grant fullscreen while declining orientation lock.
    }
    return fullscreenHost(doc) ? 'active' : 'unavailable';
  };
  const result = request().finally(() => pending.delete(doc));
  pending.set(doc, result);
  return result;
}

export function startImmersiveFromGesture(event) {
  const data = document.documentElement.dataset;
  if (!event.isTrusted || navigator.userActivation?.isActive === false || startAttempted || data.portable !== 'true' || data.displayMode !== 'browser' ||
      fullscreenHost(document) || !window.matchMedia('(orientation: landscape)').matches) return;
  startAttempted = true;
  void enterLandscape().then(result => {
    if (result !== 'active' && !showedRestriction) {
      showedRestriction = true;
      toast('현재 화면에서 플레이할 수 있습니다. 링크와 홈 화면 안내는 설정에서 확인하세요.');
    }
  });
}

function shareControls() {
  const url = lobbyAddress();
  const address = el('input',{value:url,readOnly:true,'aria-label':'게임 주소'});
  const status = el('span',{role:'status'});
  const copy = button('주소 복사', async () => {
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = '공식 게임 주소를 복사했습니다.';
    } catch {
      address.focus();
      address.select();
      status.textContent = '선택된 주소를 직접 복사해 주세요.';
    }
  }, 'secondary');
  return [address, copy, status];
}

const storageNote = '브라우저나 홈 화면 앱을 바꾸면 이 기기의 원정 저장이 공유되지 않을 수 있습니다.';

export function linkSettings() {
  const installed = displayMode(window) === 'standalone';
  return el('details',{class:'link-settings'},
    el('summary',{text:'공식 링크 · 홈 화면 안내'}),
    el('p',{text:installed ? '홈 화면 앱으로 실행 중입니다.' : '자주 플레이한다면 브라우저의 공유 또는 메뉴에서 홈 화면에 추가할 수 있습니다.'}),
    el('p',{text:storageNote}), ...shareControls());
}

// A failed explicit request offers help without trapping input or replacing another dialog.
function showHelp(trigger) {
  if (closeHelp) { closeHelp(); return; }
  const help = el('aside',{class:'fullscreen-help',role:'region','aria-label':'전체화면 안내'});
  function close(restoreFocus=false) {
    help.remove();
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('keydown', escape, true);
    window.removeEventListener('hashchange', closeOnRoute);
    hostDialog?.removeEventListener('close', closeOnRoute);
    closeHelp = null;
    if (restoreFocus && trigger.isConnected) trigger.focus({preventScroll:true});
  }
  const outside = e => { if (!help.contains(e.target) && e.target !== trigger) close(); };
  const escape = e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
  };
  const closeOnRoute = () => close();
  const hostDialog = trigger.closest('dialog[open]');
  const resume = button('현재 화면에서 계속', () => close(true), 'primary');
  help.append(el('p',{text:'이 브라우저에서는 전체화면이 제한됩니다. 가로로 플레이하거나 앱 메뉴에서 일반 브라우저로 열 수 있습니다.'}),
    el('p',{text:storageNote}), ...shareControls(), resume);
  if (hostDialog) hostDialog.querySelector('.dialog-body').prepend(help);
  else (fullscreenHost(document) ?? document.body).append(help);
  resume.focus({preventScroll:true});
  closeHelp = close;
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('keydown', escape, true);
  window.addEventListener('hashchange', closeOnRoute);
  hostDialog?.addEventListener('close', closeOnRoute);
}

function label(node) {
  const active = !!fullscreenHost(document);
  const standalone = displayMode(window) === 'standalone';
  node.textContent = active ? '전체화면 종료' : node.dataset.entry && !standalone ? '가로 전체화면 시작' : '전체화면';
  node.setAttribute('aria-pressed', String(active));
  node.title = standalone && !active ? '홈 화면 앱 · 전체화면 전환' : node.textContent;
}

export function fullscreenButton({entry=false}={}) {
  const node = button('', async event => {
    if (!event.isTrusted) return;
    startAttempted = true;
    const host = fullscreenHost(document);
    if (host) {
      try {
        await (document.exitFullscreen ?? document.webkitExitFullscreen).call(document);
      } catch { toast('브라우저의 전체화면 종료 기능을 이용하세요.'); }
    } else if (await enterLandscape() !== 'active' && node.isConnected) {
      showedRestriction = true;
      showHelp(node);
    }
    label(node);
  },'quiet fullscreen-toggle',{'aria-label':'전체화면 전환'});
  if (entry) node.dataset.entry = 'true';
  label(node);
  return node;
}

export function syncFullscreenButtons() {
  const queries = ['standalone','fullscreen'].map(mode => matchMedia('(display-mode: '+mode+')'));
  function sync() {
    document.documentElement.dataset.displayMode = displayMode(window);
    document.querySelectorAll('.fullscreen-toggle').forEach(label);
  }
  for (const event of ['fullscreenchange','webkitfullscreenchange']) document.addEventListener(event, sync);
  queries.forEach(query => query.addEventListener?.('change', sync));
  sync();
  return () => {
    for (const event of ['fullscreenchange','webkitfullscreenchange']) document.removeEventListener(event, sync);
    queries.forEach(query => query.removeEventListener?.('change', sync));
    closeHelp?.();
  };
}
