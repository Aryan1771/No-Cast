(() => {
  "use strict";

  const define = Object.defineProperty;
  const descriptor = Object.getOwnPropertyDescriptor;
  const reject = Promise.reject.bind(Promise);
  const resolve = Promise.resolve.bind(Promise);
  const reason = () => new DOMException(
    "Casting and screen sharing are disabled by No Cast & Screen Share.",
    "NotAllowedError"
  );
  const deny = () => reject(reason());

  function replace(target, key, value) {
    if (!target) return;
    try {
      define(target, key, { value, configurable: false, writable: false });
    } catch (_) {
      // A non-configurable browser property cannot safely be replaced.
    }
  }

  // Capture only the display-sharing APIs. Camera/microphone access, ordinary
  // video playback, and Picture-in-Picture are deliberately left untouched.
  if (typeof MediaDevices !== "undefined") {
    replace(MediaDevices.prototype, "getDisplayMedia", deny);
  }
  if (navigator.mediaDevices) {
    replace(navigator.mediaDevices, "getDisplayMedia", deny);
  }
  if ("getDisplayMedia" in navigator) replace(navigator, "getDisplayMedia", deny);

  // Older Chromium implementations allowed display capture via getUserMedia
  // vendor constraints. Deny those requests without affecting camera/mic use.
  function requestsDisplay(constraints) {
    const displaySource = (value) => typeof value === "string" &&
      /^(screen|window|desktop|tab|browser)$/i.test(value);
    return [constraints?.video, constraints?.audio].some((track) => {
      if (!track || typeof track !== "object") return false;
      return [track, track.mandatory, ...(Array.isArray(track.optional) ? track.optional : [])]
        .filter(Boolean).some((part) =>
          displaySource(part.chromeMediaSource) || displaySource(part.mediaSource) ||
          displaySource(part.mozMediaSource));
    });
  }
  if (navigator.mediaDevices?.getUserMedia) {
    const original = navigator.mediaDevices.getUserMedia;
    const guarded = function (constraints) {
      return requestsDisplay(constraints) ? deny() : Reflect.apply(original, this, [constraints]);
    };
    replace(navigator.mediaDevices, "getUserMedia", guarded);
    if (typeof MediaDevices !== "undefined") replace(MediaDevices.prototype, "getUserMedia", guarded);
  }
  for (const key of ["webkitGetUserMedia", "mozGetUserMedia", "getUserMedia"]) {
    if (typeof navigator[key] !== "function") continue;
    const original = navigator[key];
    replace(navigator, key, function (constraints, success, failure) {
      if (requestsDisplay(constraints)) {
        if (typeof failure === "function") queueMicrotask(() => failure(reason()));
        return;
      }
      return Reflect.apply(original, this, [constraints, success, failure]);
    });
  }

  if (typeof PresentationRequest !== "undefined") {
    replace(PresentationRequest.prototype, "start", deny);
    replace(PresentationRequest.prototype, "reconnect", deny);
    replace(PresentationRequest.prototype, "getAvailability", () => {
      const availability = new EventTarget();
      define(availability, "value", { value: false });
      availability.onchange = null;
      return resolve(availability);
    });
  }
  if (navigator.presentation) {
    try {
      define(navigator.presentation, "defaultRequest", {
        get: () => null, set: () => {}, configurable: false
      });
    } catch (_) {}
  }

  if (typeof RemotePlayback !== "undefined") {
    replace(RemotePlayback.prototype, "prompt", deny);
    let nextWatchId = 1;
    replace(RemotePlayback.prototype, "watchAvailability", function (callback) {
      if (typeof callback !== "function") return reject(new TypeError("Expected a callback."));
      queueMicrotask(() => callback(false));
      return resolve(nextWatchId++);
    });
    replace(RemotePlayback.prototype, "cancelWatchAvailability", () => resolve(undefined));
  }

  // Keep remote playback disabled even when page code toggles the JS property.
  if (typeof HTMLMediaElement !== "undefined") {
    const original = descriptor(HTMLMediaElement.prototype, "disableRemotePlayback");
    if (original?.configurable) {
      try {
        define(HTMLMediaElement.prototype, "disableRemotePlayback", {
          get: () => true,
          set() { original.set?.call(this, true); },
          configurable: false,
          enumerable: original.enumerable
        });
      } catch (_) {}
    }
  }
})();
