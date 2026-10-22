(() => {
  if (window.top !== window || window.__spankbangQuadSearchLoaded) return;
  if (!/^\/s\//.test(location.pathname)) return;
  window.__spankbangQuadSearchLoaded = true;

  const VIDEO_PATH = /^\/([a-z0-9]+)\/video(?:\/|$)/i;
  const STYLE_ID = 'sbqp-style';
  const PANEL_ID = 'sbqp-panel';
  let selected = [];
  let noticeTimer;

  const styles = `
    .sbqp-check{position:absolute!important;z-index:2147483646!important;top:8px!important;left:8px!important;width:36px!important;height:36px!important;margin:0!important;accent-color:#c4f26a!important;cursor:pointer!important;filter:drop-shadow(0 1px 3px #000)!important}
    #${PANEL_ID}{position:fixed;z-index:2147483647;right:18px;bottom:18px;display:flex;align-items:center;gap:12px;padding:12px 14px;background:#16181eeF;border:1px solid #41444e;border-radius:14px;color:#f7f7fa;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px #0008}
    #${PANEL_ID} .sbqp-count{min-width:112px;font-weight:650}
    #${PANEL_ID} .sbqp-message{position:absolute;right:0;bottom:calc(100% + 8px);padding:7px 10px;border-radius:8px;background:#3b2424;color:#ffd5d5;white-space:nowrap;font-size:12px;opacity:0;transition:opacity .15s;pointer-events:none}
    #${PANEL_ID}.sbqp-error .sbqp-message{opacity:1}
    #${PANEL_ID} button{border:0;border-radius:9px;padding:9px 12px;background:#c4f26a;color:#18200f;font:700 13px system-ui,sans-serif;cursor:pointer}
    #${PANEL_ID} button:disabled{opacity:.42;cursor:not-allowed}
    #${PANEL_ID} .sbqp-clear{background:#30333c;color:#f3f3f5}
    #${PANEL_ID} .sbqp-links{display:flex;align-items:center;gap:8px;margin-left:2px}#${PANEL_ID} .sbqp-links a{display:grid;place-items:center;width:30px;height:30px;border:1px solid #555862;border-radius:50%;color:#e9ebef;text-decoration:none}#${PANEL_ID} .sbqp-links a:hover{color:#c4f26a;border-color:#c4f26a}#${PANEL_ID} .sbqp-links svg{width:16px;height:16px;fill:currentColor}
    a[data-sbqp-anchor="1"]{position:relative!important}
    @media(max-width:600px){#${PANEL_ID}{left:12px;right:12px;bottom:12px;justify-content:space-between;gap:6px;padding:9px}#${PANEL_ID} .sbqp-count{min-width:auto;font-size:12px}#${PANEL_ID} button{padding:8px;font-size:12px}#${PANEL_ID} .sbqp-links{gap:4px}#${PANEL_ID} .sbqp-links a{width:28px;height:28px}}
  `;

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style'); style.id = STYLE_ID; style.textContent = styles;
    (document.head || document.documentElement).append(style);
  }

  function videoInfo(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      if (!/spankbang\.(com|party)$/i.test(url.hostname)) return null;
      const match = url.pathname.match(VIDEO_PATH);
      if (!match) return null;
      const id = match[1];
      const canonical = `${url.origin}/${id}/video/${url.pathname.split('/').slice(3).join('/')}`.replace(/\/$/, '');
      const title = anchor.getAttribute('title') || anchor.getAttribute('aria-label') ||
        anchor.closest('[class*="video"], [class*="item"], article')?.innerText?.split('\n').find(x => x.trim()) ||
        decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) || `Video ${id}`).replace(/[+_-]+/g, ' ');
      return { id, url: canonical, embedUrl: `${url.origin}/${id}/embed/`, title: title.trim().slice(0, 180) };
    } catch { return null; }
  }

  function updatePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.querySelector('.sbqp-count').textContent = `${selected.length} / 4 selected`;
    panel.querySelector('.sbqp-open').disabled = selected.length < 1;
  }

  function error(message) {
    const panel = document.getElementById(PANEL_ID); if (!panel) return;
    panel.querySelector('.sbqp-message').textContent = message;
    panel.classList.add('sbqp-error'); clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => panel.classList.remove('sbqp-error'), 2200);
  }

  function buildPanel() {
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement('div'); panel.id = PANEL_ID;
    panel.innerHTML = '<span class="sbqp-count">0 / 4 selected</span><span class="sbqp-message" aria-live="polite"></span><button type="button" class="sbqp-clear">Clear</button><button type="button" class="sbqp-open" disabled>Open Quad Player</button><nav class="sbqp-links" aria-label="Contact links"><a href="mailto:okcysk@gmail.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm9 7L3 7v10h18V7l-9 5zm0-2 7-3H5l7 3z"/></svg></a><a href="https://x.com/okcysk46770" target="_blank" rel="noopener noreferrer" aria-label="X" title="X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.42L5.56 22H2.43l7.25-8.28L1.8 2h6.4l4.43 6.78L18.9 2zm-1.1 18h1.73L7.26 3.9H5.4L17.8 20z"/></svg></a></nav>';
    panel.querySelector('.sbqp-clear').addEventListener('click', () => {
      selected = [];
      for (const input of document.querySelectorAll('.sbqp-check')) input.checked = false;
      chrome.storage.local.set({ selectedVideos: [] }); updatePanel();
    });
    panel.querySelector('.sbqp-open').addEventListener('click', () => {
      if (selected.length < 1 || selected.length > 4) return;
      chrome.storage.local.set({ selectedVideos: selected }, () => chrome.runtime.sendMessage({ type: 'open-quad-player' }));
    });
    document.body.append(panel);
    // Start each new search page with a clean selection so stale saved videos
    // cannot leave the counter at 4/4 while no visible checkboxes are checked.
    selected = [];
    chrome.storage.local.set({ selectedVideos: [] }, () => { scan(); updatePanel(); });
  }

  function scan() {
    addStyle(); buildPanel();
    for (const anchor of document.querySelectorAll('a[href*="/video/"]')) {
      // Only place the selector on the thumbnail link, never on the title link.
      if (!anchor.querySelector('img')) continue;
      const info = videoInfo(anchor);
      if (!info || anchor.querySelector('.sbqp-check')) continue;
      anchor.dataset.sbqpAnchor = '1';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'sbqp-check';
      checkbox.dataset.videoId = info.id;
      checkbox.checked = selected.some(item => item.id === info.id);
      checkbox.setAttribute('aria-label', `Select ${info.title}`);
      checkbox.title = 'Select video';
      checkbox.addEventListener('click', event => { event.stopPropagation(); });
      checkbox.addEventListener('change', event => {
        event.stopPropagation();
        if (checkbox.checked) {
          if (selected.length >= 4) { checkbox.checked = false; error('Select up to four videos.'); return; }
          if (!selected.some(item => item.id === info.id)) selected.push(info);
        } else selected = selected.filter(item => item.id !== info.id);
        for (const other of document.querySelectorAll(`.sbqp-check[data-video-id="${CSS.escape(info.id)}"]`)) other.checked = selected.some(item => item.id === info.id);
        chrome.storage.local.set({ selectedVideos: selected }); updatePanel();
      });
      anchor.append(checkbox);
    }
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
