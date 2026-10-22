const SEARCH_URL = 'https://jp.spankbang.com/s/cute+japanese/';

function openPlayer() {
  chrome.storage.local.get({ selectedVideos: [] }, ({ selectedVideos }) => {
    const validSelection = Array.isArray(selectedVideos) && selectedVideos.length >= 1 && selectedVideos.length <= 4;
    const path = validSelection ? 'player.html' : 'player.html?choose=1';
    chrome.tabs.create({ url: chrome.runtime.getURL(path) });
  });
}

chrome.action.onClicked.addListener(openPlayer);
chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'open-quad-player') openPlayer();
  if (message?.type === 'open-search') chrome.tabs.create({ url: SEARCH_URL });
});
