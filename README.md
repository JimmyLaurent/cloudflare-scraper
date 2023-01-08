# cloudflare-scraper

Chrome is used to retrieve cloudflare cookies then **got** is used to perform requests making this solution reliable but also pretty fast.

> Version 2 is a complete rewrite: 
> - it doesn't use puppeteer but vanilla chromium,
> - **request** package was replaced by **got** ,
> - headless support only works on **linux** out of the box but should be doable on windows or mac os with the help of docker or wsl.
> - extra features were removed (captcha bypass, etc..)

## Install

```bash
npm install cloudflare-scraper
```

Make sure you alse have **xfvb** linux package installed

```bash
# for ubuntu users
sudo apt-get install xvfb
``` 

## Quick Example

```js
import got from 'cloudflare-scraper';

(async () => {
  try {
    const response = await got.get('https://nowsecure.nl');
    console.log(response.body);
  } catch (error) {
    console.log(error);
  }
})();
```

## API

Check **got** [documenatation](https://github.com/sindresorhus/got#documentation)

## Env variables

### NODE_CHROMIUM_SKIP_INSTALL (boolean)

By default, chromium is downloaded but on `npm install` command but you can skip the installation by enabling this variable.

```bash
export NODE_CHROMIUM_SKIP_INSTALL=true
```

### CHROME_EXECUTABLE_PATH (string)

Specify a chrome executable

```bash
export CHROME_EXECUTABLE_PATH=/path/to/chrome
```

### CF_SCRAPER_HEADLESS (boolean)

Enable/disable headless mode (enabled by default)

Note: headless mode uses "xfvb" and is only available on linux

```bash
export CF_SCRAPER_HEADLESS=false
```

## TODO:

- add proxy support
- docker example