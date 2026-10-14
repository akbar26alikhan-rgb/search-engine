# DeepSeekr Brave Browser Extension

A high-performance Manifest V3 browser extension for Brave and Chromium browsers that seamlessly integrates DeepSeekr deep research directly into your browser workflow.

## Features

- **Instant Search**: Launch Quick Search or Deep Research directly from the browser popup.
- **Contextual Research**: Select any text on any webpage, right-click, and select **"DeepSeekr: Research..."** to initiate an in-depth inquiry.
- **One-Click Page Analysis**: Right-click on any article or documentation page to analyze its context and find complementary technical sources.
- **Web App Bridge**: One-click jump to the full cited research report in the DeepSeekr web app.
- **Configurable Backend**: Easily point the extension to your local instance (`http://localhost:3000`) or your remote cloud URL.

## How to Install in Brave (Desktop)

1. Open **Brave Browser**.
2. In the URL bar, navigate to: `brave://extensions` (or click Menu ➔ Extensions).
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. Click the **"Load unpacked"** button in the top left.
5. In the file picker dialog, select the `extension` folder located inside the DeepSeekr project directory.
6. The **DeepSeekr - AI Deep Search** extension will now appear in your extensions list.
7. Click the extension puzzle icon in Brave's toolbar and click the **Pin** icon to pin DeepSeekr to your toolbar.

## Brave-Specific Compatibility Notes

- **Brave Shields**: DeepSeekr connects to your configured backend server (`http://localhost:3000` or HTTPS cloud domain). Brave Shields does not interfere with extension local/API requests, but make sure to allow the extension connection if prompted.
- **Android Support**: To use DeepSeekr on Brave Android, you can add DeepSeekr as your **Custom Search Engine** (see below) or use Brave on desktop with sync.

## Custom Search Engine Setup in Brave

To make DeepSeekr your default or keyword search engine in Brave:

1. Open Brave and go to `brave://settings/searchEngines`.
2. Under **Site search**, click **Add**.
3. Fill in the details:
   - **Name**: `DeepSeekr`
   - **Shortcut**: `:ds` (or `ds`)
   - **URL with %s in place of query**: `http://localhost:3000/search?q=%s` (or your cloud URL: `https://YOUR-APP-URL/search?q=%s`)
4. Click **Save**.
5. You can now type `:ds react compiler` directly in Brave's address bar to trigger DeepSeekr instantly!
