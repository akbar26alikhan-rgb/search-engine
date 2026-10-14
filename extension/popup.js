const DEFAULT_SERVER_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const queryInput = document.getElementById('queryInput');
  const btnQuickSearch = document.getElementById('btnQuickSearch');
  const btnDeepSearch = document.getElementById('btnDeepSearch');
  const btnGrabSelection = document.getElementById('btnGrabSelection');
  const btnGrabPage = document.getElementById('btnGrabPage');
  const btnSettings = document.getElementById('btnSettings');
  const settingsPanel = document.getElementById('settingsPanel');
  const serverUrlInput = document.getElementById('serverUrlInput');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const settingsStatus = document.getElementById('settingsStatus');
  const statusContainer = document.getElementById('statusContainer');
  const statusText = document.getElementById('statusText');
  const resultsContainer = document.getElementById('resultsContainer');
  const resultsList = document.getElementById('resultsList');
  const resultsCount = document.getElementById('resultsCount');
  const btnOpenWeb = document.getElementById('btnOpenWeb');

  const stored = await chrome.storage.local.get('serverUrl');
  let currentServerUrl = stored.serverUrl || DEFAULT_SERVER_URL;
  serverUrlInput.value = currentServerUrl;

  btnSettings.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  btnSaveSettings.addEventListener('click', async () => {
    const val = serverUrlInput.value.trim().replace(/\/+$/, '');
    if (val) {
      currentServerUrl = val;
      await chrome.storage.local.set({ serverUrl: val });
      settingsStatus.textContent = 'Server URL saved!';
      setTimeout(() => {
        settingsStatus.textContent = '';
        settingsPanel.classList.add('hidden');
      }, 1500);
    }
  });

  btnGrabPage.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.title) {
      const cleanTitle = tab.title.split(' - ')[0].split(' | ')[0];
      queryInput.value = cleanTitle;
    }
  });

  btnGrabSelection.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || '',
      });

      if (result && result.trim()) {
        queryInput.value = result.trim();
      }
    } catch (err) {
      console.warn('Could not grab selection:', err);
    }
  });

  async function performSearch(mode) {
    const q = queryInput.value.trim();
    if (!q) {
      queryInput.focus();
      return;
    }

    statusContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    resultsList.innerHTML = '';
    statusText.textContent = mode === 'deep' ? 'Conducting Deep Research across multi-angle sources...' : 'Executing Quick Search...';

    try {
      const res = await fetch(`${currentServerUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, mode }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      renderResults(data, q, mode);
    } catch (err) {
      statusText.textContent = `Error: ${err.message}. Make sure DeepSeekr server is running at ${currentServerUrl}`;
    }
  }

  btnQuickSearch.addEventListener('click', () => performSearch('quick'));
  btnDeepSearch.addEventListener('click', () => performSearch('deep'));

  function renderResults(data, query, mode) {
    statusContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    const results = data.results || [];
    resultsCount.textContent = `${results.length} Sources Found`;

    btnOpenWeb.onclick = () => {
      const targetUrl = `${currentServerUrl}/search?q=${encodeURIComponent(query)}&mode=${mode}`;
      chrome.tabs.create({ url: targetUrl });
    };

    resultsList.innerHTML = '';
    results.slice(0, 10).forEach(item => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
        <div class="result-domain">${escapeHtml(item.domain)} • [${item.category}]</div>
        <div class="result-snippet">${escapeHtml(item.snippet)}</div>
      `;
      resultsList.appendChild(card);
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
});
