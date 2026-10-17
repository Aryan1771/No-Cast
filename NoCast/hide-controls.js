(() => {
  "use strict";
  const watchedRoots = new WeakSet();
  const shadowStyle = `
    google-cast-launcher,media-cast-button,.ytp-remote-button,.ytp-cast-button,
    .vjs-chromecast-button,.jw-icon-cast,.shaka-cast-button,
    button[aria-label="Cast" i],button[aria-label^="Cast to " i],
    button[aria-label="Play on TV" i],button[title="Cast" i],
    button[aria-label="Share screen" i],button[aria-label="Share your screen" i],
    button[aria-label="Start screen sharing" i],button[aria-label="Present now" i],
    [role="button"][aria-label="Cast" i],[role="button"][aria-label="Play on TV" i],
    [role="button"][aria-label="Share screen" i],
    video::-webkit-media-controls-cast-button,audio::-webkit-media-controls-cast-button
    {display:none!important;visibility:hidden!important;pointer-events:none!important}
  `;

  function protectMedia(media) {
    if (!media.hasAttribute("disableremoteplayback")) media.setAttribute("disableremoteplayback", "");
    try {
      if (media.controlsList && !media.controlsList.contains("noremoteplayback")) {
        media.controlsList.add("noremoteplayback");
      }
    } catch (_) {}
  }

  function scan(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.matches("video,audio")) protectMedia(node);
      if (node.shadowRoot) watch(node.shadowRoot);
    }
    if (!node.querySelectorAll) return;
    for (const media of node.querySelectorAll("video,audio")) protectMedia(media);
    for (const element of node.querySelectorAll("*")) {
      if (element.shadowRoot) watch(element.shadowRoot);
    }
  }

  function watch(root) {
    if (watchedRoots.has(root)) return;
    watchedRoots.add(root);
    if (root instanceof ShadowRoot) {
      const style = document.createElement("style");
      style.textContent = shadowStyle;
      root.append(style);
    }
    new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "attributes") {
          if (change.target.matches("video,audio")) protectMedia(change.target);
        } else {
          for (const node of change.addedNodes) scan(node);
        }
      }
    }).observe(root, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ["disableremoteplayback", "controlslist"]
    });
    scan(root);
  }
  watch(document);
})();
