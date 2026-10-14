const DEFAULT_SERVER_URL = 'http://localhost:3000';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'deepseekr-search-selection',
    title: 'DeepSeekr: Research "%s"',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'deepseekr-analyze-page',
    title: 'DeepSeekr: Analyze this page',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { serverUrl = DEFAULT_SERVER_URL } = await chrome.storage.local.get('serverUrl');
  const cleanBase = serverUrl.replace(/\/+$/, '');

  if (info.menuItemId === 'deepseekr-search-selection' && info.selectionText) {
    const searchUrl = `${cleanBase}/search?q=${encodeURIComponent(info.selectionText)}&mode=deep`;
    chrome.tabs.create({ url: searchUrl });
  } else if (info.menuItemId === 'deepseekr-analyze-page' && tab && tab.url) {
    const searchUrl = `${cleanBase}/search?q=${encodeURIComponent(tab.title || tab.url)}&mode=deep`;
    chrome.tabs.create({ url: searchUrl });
  }
});
