# cloudflare-scraper

Puppeteer (chromium headless) is used to retrieve cloudflare cookies then request module is used to perform requests making this solution reliable but also pretty fast.

## Install

```bash
npm install cloudflare-scraper
```

## Quick Example

```js
const cloudfareScraper = require('cloudflare-scraper');

(async () => {
  try {
    const response = await cloudfareScraper.get('https://cloudflare-url.com');
    console.log(response);
  } catch (error) {
    console.log(error);
  }
})();
```

## API

TODO (same api as request package)

## TODO list

- improve stealth
- proxy support
