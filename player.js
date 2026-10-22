const SEARCH_URL = 'https://jp.spankbang.com/s/cute+japanese/';
const grid = document.querySelector('#grid');
const empty = document.querySelector('#empty');
const slots = [];
let activeSlot = 0;
let bindings = {};

function makeEmbed(item) {
  try {
    const source = new URL(item.url);
    const id = item.id || source.pathname.split('/').filter(Boolean)[0];
    const embed = new URL(item.embedUrl || `${source.origin}/${id}/embed/`);
    // Muted autoplay is the browser-compatible way to start cross-origin embeds without a play click.
    embed.searchParams.set('autoplay', '1');
    embed.searchParams.set('muted', '1');
    return { ...item, id, embedUrl: embed.href };
  } catch { return null; }
}

function createSlot(index) {
  const cell = document.createElement('section'); cell.className = 'cell';
  const iframe = document.createElement('iframe');
  iframe.loading = 'eager';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  const label = document.createElement('div'); label.className = 'cell-label';
  const number = document.createElement('span'); number.className = 'cell-number'; number.textContent = String(index + 1);
  const title = document.createElement('span'); title.className = 'cell-title';
  const link = document.createElement('a'); link.className = 'cell-link'; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Open video ↗';
  label.append(number, title, link); cell.append(iframe, label); grid.append(cell);
  const controls = document.createElement('div'); controls.className = 'cell-controls';
  const play = document.createElement('button'); play.type = 'button'; play.textContent = 'Play'; play.title = 'Start playback';
  play.addEventListener('click', () => {
    activeSlot = index;
    postToEmbed(slot, { type: 'sbqp-play' });
    iframe.focus();
  });
  const reload = document.createElement('button'); reload.type = 'button'; reload.textContent = 'Reload'; reload.title = 'Reload this video';
  reload.addEventListener('click', () => {
    activeSlot = index;
    if (slot.item) iframe.src = slot.item.embedUrl;
  });
  const volume = document.createElement('input'); volume.type = 'range'; volume.className = 'cell-volume';
  volume.min = '0'; volume.max = '100'; volume.value = '100'; volume.setAttribute('aria-label', `Volume for video ${index + 1}`);
  volume.title = 'Volume';
  volume.addEventListener('input', () => postToEmbed(slot, { type: 'sbqp-volume', value: Number(volume.value) / 100 }));
  const mute = document.createElement('button'); mute.type = 'button'; mute.className = 'cell-mute';
  mute.textContent = '🔊'; mute.title = 'Mute'; mute.setAttribute('aria-label', `Mute video ${index + 1}`);
  mute.addEventListener('click', () => postToEmbed(slot, { type: 'sbqp-mute-toggle' }));
  iframe.addEventListener('focus', () => { activeSlot = index; });
  controls.append(play, reload, volume, mute); cell.append(controls);
  const slot = { cell, iframe, title, link, volume, mute, muted: false, item: null, selected: false, order: index };
  iframe.addEventListener('load', () => {
    setTimeout(() => postToEmbed(slot, { type: 'sbqp-volume', value: Number(volume.value) / 100 }), 250);
  });
  return slot;
}

window.addEventListener('message', event => {
  const state = event.data;
  if (event.source === window || state?.type !== 'sbqp-volume-state') return;
  const slot = slots.find(candidate => candidate.iframe.contentWindow === event.source);
  if (!slot) return;
  slot.volume.value = String(Math.round(Math.max(0, Math.min(1, Number(state.volume) || 0) * 100)));
  slot.muted = Boolean(state.muted);
  slot.mute.textContent = state.muted ? '🔇' : '🔊';
  slot.mute.title = state.muted ? 'Unmute' : 'Mute';
  slot.mute.setAttribute('aria-label', `${state.muted ? 'Unmute' : 'Mute'} video ${slot.order + 1}`);
});

function postToEmbed(slot, message) {
  slot?.iframe.contentWindow?.postMessage(message, '*');
}

function pauseAll() {
  for (const slot of slots) if (slot.item) postToEmbed(slot, { type: 'sbqp-pause' });
}

function toggleMuteAll() {
  const mute = slots.some(slot => slot.item && !slot.muted);
  for (const slot of slots) {
    if (!slot.item) continue;
    slot.muted = mute;
    postToEmbed(slot, { type: 'sbqp-mute-state', muted: mute });
  }
}

function handleGlobalShortcut(key) {
  const binding = bindings[key];
  if (!binding) return false;
  if (binding.action === 'pauseAll') pauseAll();
  else if (binding.action === 'muteAll') toggleMuteAll();
  else return false;
  return true;
}

function showEmpty(message) {
  grid.hidden = true; empty.hidden = false;
  empty.querySelector('h1').textContent = message;
  empty.querySelector('p').textContent = 'Open the search results and select up to four videos. Unused panels remain black. Changes to the checkboxes will update this player without restarting videos that remain selected.';
}

function applySelection(items) {
  const videos = Array.isArray(items) ? items.map(makeEmbed).filter(Boolean).slice(0, 4) : [];
  if (slots.length === 0 && videos.length === 0) {
    showEmpty('Select up to four videos');
    return;
  }

  if (slots.length === 0) {
    grid.replaceChildren();
    for (let i = 0; i < 4; i++) slots.push(createSlot(i));
  }
  grid.hidden = false; empty.hidden = true;

  const selectedIds = new Set(videos.map(item => item.id));
  for (const slot of slots) slot.selected = Boolean(slot.item && selectedIds.has(slot.item.id));

  // Stop and clear videos that were unchecked, leaving their panels black.
  for (const slot of slots) {
    if (slot.item && !selectedIds.has(slot.item.id)) {
      slot.iframe.removeAttribute('src');
      slot.iframe.title = '';
      slot.title.textContent = '';
      slot.link.removeAttribute('href');
      slot.item = null;
      slot.selected = false;
    }
  }

  // Keep streams for videos that remain selected. Fill released cells with newly selected videos.
  for (const item of videos) {
    if (slots.some(slot => slot.item?.id === item.id)) continue;
    const slot = slots.find(candidate => !candidate.selected);
    if (!slot) break;
    slot.item = item;
    slot.selected = true;
    slot.iframe.src = item.embedUrl;
    slot.iframe.title = item.title || `Video ${slot.order + 1}`;
    slot.title.textContent = item.title || `Video ${slot.order + 1}`;
    slot.link.href = item.url;
  }
}

chrome.storage.local.get({ selectedVideos: [] }, ({ selectedVideos }) => applySelection(selectedVideos));
document.querySelector('#pause-all').addEventListener('click', pauseAll);
document.querySelector('#fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.shiftKey) {
    const key = event.code === 'Space' ? 'Shift+Space' : `Shift+${event.key.toLowerCase()}`;
    if (handleGlobalShortcut(key)) event.preventDefault();
    return;
  }
  if (event.code !== 'Space') return;
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))) return;
  const slot = slots[activeSlot];
  if (!slot?.item) return;
  event.preventDefault();
  postToEmbed(slot, { type: 'sbqp-toggle' });
});
window.addEventListener('message', event => {
  if (!slots.some(slot => slot.iframe.contentWindow === event.source) || event.data?.type !== 'sbqp-global-shortcut') return;
  handleGlobalShortcut(event.data.key);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.selectedVideos) applySelection(changes.selectedVideos.newValue);
});
document.querySelector('#search-link').href = SEARCH_URL;
const DEFAULT_BINDINGS = { 'Shift+Space': { action: 'pauseAll', value: 0 }, 'Shift+m': { action: 'muteAll', value: 0 } };
chrome.storage.sync.get({ keyBindings: DEFAULT_BINDINGS }, result => { bindings = { ...DEFAULT_BINDINGS, ...(result.keyBindings || {}) }; });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.keyBindings) bindings = { ...DEFAULT_BINDINGS, ...(changes.keyBindings.newValue || {}) };
});
