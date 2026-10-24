import { useSyncExternalStore } from "react";

// one shared "am I online?" value for the whole app
let online = typeof navigator === "undefined" ? true : navigator.onLine;
const subs = new Set();

function set(value) {
  if (value === online) return;
  online = value;
  subs.forEach((fn) => fn());
}

// tiny requests that only work with real internet
const PROBES = [
  "https://www.gstatic.com/generate_204",
  "https://www.cloudflare.com/cdn-cgi/trace",
];

const probe = (url) =>
  fetch(`${url}?t=${Date.now()}`, {
    mode: "no-cors",
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });

let running = null;

// really tries to reach the internet (the browser flag can be wrong)
export function recheck() {
  if (running) return running;
  running = (async () => {
    try {
      await Promise.any(PROBES.map(probe));
      set(true);
      return true;
    } catch {
      set(false);
      return false;
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

// the AI request failed because the internet is down: confirm it
export const markOffline = () => recheck();

if (typeof window !== "undefined" && !window.__aureliaNet) {
  window.__aureliaNet = true;
  window.addEventListener("offline", () => set(false)); // instant
  window.addEventListener("online", () => recheck());
  window.addEventListener("focus", () => recheck());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) recheck();
  });
  setInterval(() => {
    if (!document.hidden) recheck();
  }, 8000);
  recheck();
}

const subscribe = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export const useOnline = () =>
  useSyncExternalStore(subscribe, () => online, () => true);

// also allow:  import useOnline from "../utils/useOnline.js"
export default useOnline;