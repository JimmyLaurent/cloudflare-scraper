# cloudflare-scraper

Puppeteer (chromium headless) is used to retrieve cloudflare cookies then request module is used to perform requests making this solution reliable but also pretty fast.

## Install

```bash
npm install cloudflare-scraper puppeteer
```

## Extra Features

- **hCaptcha bypass**

- **stormwall bypass**

## Quick Example

```js
const cloudflareScraper = require('cloudflare-scraper');

(async () => {
  try {
    const response = await cloudflareScraper.get('https://cloudflare-url.com');
    console.log(response);
  } catch (error) {
    console.log(error);
  }
})();
```

## API

TODO (same api as request package)

## TODO list

- documentation