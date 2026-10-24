import { useEffect, useRef, useState } from "react";
import useOnline from "../utils/useOnline.js";

const WifiOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2.4-1.9M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-9.6-3.7M12 20h.01" />
  </svg>
);

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export default function NetStatus() {
  const online = useOnline();
  const [showBack, setShowBack] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setShowBack(false);
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      setShowBack(true);
      const t = setTimeout(() => setShowBack(false), 3000);
      return () => clearTimeout(t);
    }
  }, [online]);

  if (online && !showBack) return null;

  return (
    <div className={`netbar ${online ? "back" : "off"}`} role="status" aria-live="polite">
      {online ? <Check /> : <WifiOff />}
      {online ? (
        <span>Back online</span>
      ) : (
        <span>
          You're offline <small>The calculator and history still work. Voice and AI answers need internet.</small>
        </span>
      )}
    </div>
  );
}