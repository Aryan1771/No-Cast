# No Cast & Screen Share — Opera GX extension

Standalone Manifest V3 extension for ordinary HTTP/HTTPS websites in Opera GX.

## Install

1. Open `opera://extensions` in Opera GX.
2. Enable **Developer mode**, choose **Load unpacked**, and select this folder (the folder containing `manifest.json`). If using the ZIP, extract it first.
3. Refresh existing website tabs. New tabs are covered automatically. Pin the extension from the extensions menu if you want its information popup.

To turn blocking off, disable this extension on `opera://extensions`, then reload affected tabs. Keep this folder in place while using the unpacked extension.

## What it does

- Runs at document start in matching pages and matching/related embedded frames.
- Rejects `getDisplayMedia` requests with `NotAllowedError`, including the standard MediaDevices prototype and instance routes.
- Rejects legacy screen/desktop/tab constraints in `getUserMedia`, while preserving normal camera/microphone requests.
- Rejects Presentation API start/reconnect calls and reports no presentation availability.
- Rejects Remote Playback prompts and reports no remote playback availability.
- Applies `disableRemotePlayback` and `controlsList=noremoteplayback` to existing and dynamically added video/audio elements, and reapplies attributes if a page removes them.
- Hides common YouTube, Google Cast, Video.js, JW Player, Shaka, and explicitly labelled Cast/Play on TV controls, plus common start-screen-sharing controls.
- Handles open shadow roots present when their host is scanned. Closed shadow roots and shadow roots attached later to existing hosts may not receive cosmetic hiding.

Screen-sharing features in Meet, Teams, Discord, recording tools, etc. are intentionally unavailable while this extension is enabled. Camera, microphone, ordinary playback, downloads, and Picture-in-Picture are not disabled.

## Limits

This is a best-effort website extension, **not a browser-wide security policy or an absolute prevention guarantee**. Browser extension restrictions still apply:

- It cannot remove Opera's own toolbar/menu/context-menu icons, disable native browser Cast commands, or change OS casting features.
- It cannot run on protected browser/extension-store pages. Private windows need the user to enable private access separately; no such setting is changed automatically.
- It does not stop an already active casting or screen-sharing session. Stop those sessions using the browser before enabling the extension.
- Custom controls, localized labels, closed shadow roots, unsupported APIs, or page code that interferes with MAIN-world patches can limit coverage. A visible custom button can remain even when its standard API call is blocked.
- Calls made before installation or before an existing tab is refreshed are not covered. Reload after installing, enabling, or disabling.

## Privacy

No background worker, analytics, external requests, remote code, cookies, saved URLs, accounts, browsing-history access, camera/microphone permission, or captured screen data. Content scripts require website access so they can modify page APIs and controls locally. No data is stored or sent anywhere.

## Official references

- [Opera extension installation](https://help.opera.com/en/extensions/testing/)
- [Chromium content-script worlds, frames and document-start injection](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)
- [W3C Screen Capture API](https://www.w3.org/TR/screen-capture/)
- [W3C Presentation API](https://www.w3.org/TR/presentation-api/)
- [W3C Remote Playback API](https://www.w3.org/TR/remote-playback/)
