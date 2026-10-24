import { useEffect, useRef, useState } from "react";
import { useOnline, recheck } from "../utils/useOnline.js";

export function WifiOffIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h.01" />
      <path d="M8.5 16.429a5 5 0 0 1 7 0" />
      <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
      <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
      <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
      <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

export default function OfflineBanner() {
  const online = useOnline();
  const [back, setBack] = useState(false); // "Back online" message
  const [checking, setChecking] = useState(false);
  const was = useRef(online);

  // show "Back online" for a moment after reconnecting
  useEffect(() => {
    let timer;
    if (was.current === false && online) {
      setBack(true);
      timer = setTimeout(() => setBack(false), 2600);
    }
    was.current = online;
    return () => clearTimeout(timer);
  }, [online]);

  const retry = async () => {
    setChecking(true);
    await recheck();
    setChecking(false);
  };

  if (online && !back) return null;

  if (online) {
    return (
      <div className="offline-bar back" role="status">
        <span className="ob-text">
          <strong>Back online</strong>
          <span>The AI assistant and voice are ready again.</span>
        </span>
      </div>
    );
  }

  return (
    <div className="offline-bar" role="alert">
      <WifiOffIcon />
      <span className="ob-text">
        <strong>You're offline</strong>
        <span>
          The calculator and history still work. The AI assistant and voice
          need internet.
        </span>
      </span>
      <button type="button" className="chip" onClick={retry} disabled={checking}>
        {checking ? "Checking…" : "Try again"}
      </button>
    </div>
  );
}