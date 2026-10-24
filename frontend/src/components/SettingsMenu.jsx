import { useEffect, useRef, useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher.jsx";
import { IconSliders } from "./Icons.jsx";

function Row({ label, hint, children }) {
  return (
    <div className="set-row">
      <div className="set-label">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function Switch({ on, onClick, label }) {
  return (
    <button
      type="button"
      className={`switch ${on ? "on" : ""}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
    >
      <span className="switch-knob" />
    </button>
  );
}

export default function SettingsMenu({
  theme,
  onTheme,
  formatLabel,
  onCycleFormat,
  soundOn,
  onSound,
  readAloud,
  onRead,
  more,
  onMore,
  onOpenAssistant,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="settings-wrap" ref={ref}>
      <button
        type="button"
        className={`icon-btn round ${open ? "on" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        aria-expanded={open}
        title="Settings"
      >
        <IconSliders />
      </button>

      {open && (
        <div className="settings" role="dialog" aria-label="Settings">
          <Row label="Theme">
            <ThemeSwitcher theme={theme} onChange={onTheme} />
          </Row>
          <Row label="Number format">
            <button type="button" className="chip" onClick={onCycleFormat}>
              {formatLabel}
            </button>
          </Row>
          <Row label="Key sound" hint="Click and vibration">
            <Switch on={soundOn} onClick={onSound} label="Key sound" />
          </Row>
          <Row label="Read aloud" hint="Keys and answers">
            <Switch on={readAloud} onClick={onRead} label="Read aloud" />
          </Row>
          <Row label="Extra keys" hint="Memory, 2nd, 1/x, |x|">
            <Switch on={more} onClick={onMore} label="Extra keys" />
          </Row>
          <Row label="AI assistant">
            <button
              type="button"
              className="chip"
              onClick={() => {
                onOpenAssistant();
                setOpen(false);
              }}
            >
              Open
            </button>
          </Row>
        </div>
      )}
    </div>
  );
}