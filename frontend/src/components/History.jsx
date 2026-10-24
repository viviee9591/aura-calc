import { useEffect, useMemo, useState } from "react";
import { formatNumbers } from "../utils/format.js";
import { copyText } from "../utils/feedback.js";
import { IconSearch, IconTrash, IconDots, IconClock } from "./Icons.jsx";

const pretty = (s) =>
  String(s)
    .replace(/([\d)%!πe])\s*([+\-×÷])\s*/g, "$1 $2 ")
    .replace(/-/g, "−");

function when(value) {
  const d = new Date(value);
  if (isNaN(d)) return "";
  const time = d
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    .toUpperCase();
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const day = same(d, today)
    ? "Today"
    : same(d, yest)
    ? "Yesterday"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${day}, ${time}`;
}

export default function History({
  items,
  open,
  error,
  numStyle,
  onUse,
  onDelete,
  onClear,
}) {
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(null);

  // close the entry menu when clicking anywhere else
  useEffect(() => {
    if (menu === null) return;
    const away = (e) => {
      if (!e.target.closest(".hmenu-wrap")) setMenu(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [menu]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (it) =>
        String(it.expression).toLowerCase().includes(t) ||
        String(it.result).toLowerCase().includes(t)
    );
  }, [items, q]);

  if (!open) return null;

  const toggleSearch = () => {
    setSearching((s) => !s);
    setQ("");
  };

  return (
    <aside className="history-card" aria-label="Recent history">
      <div className="history-inner">
        <header className="history-head">
          <h2 className="history-title">Recent History</h2>
          <button
            type="button"
            className={`icon-btn ${searching ? "on" : ""}`}
            onClick={toggleSearch}
            aria-label="Search history"
          >
            <IconSearch />
          </button>
        </header>

        {searching && (
          <input
            className="history-search"
            type="search"
            placeholder="Search calculations"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        )}

        {error && (
          <p className="history-error">
            Can't reach the server. Is the backend running?
          </p>
        )}

        <ul className="history-list">
          {shown.length === 0 && !error && (
            <li className="history-empty">
              {items.length === 0 ? "No calculations yet" : "No matches"}
            </li>
          )}

          {shown.map((it) => (
            <li key={it.id} className="history-item">
              <div className="history-text">
                <button
                  type="button"
                  className="history-expr"
                  onClick={() => onUse(it.expression, false)}
                  title="Use this expression"
                >
                  {pretty(formatNumbers(it.expression, numStyle))}
                </button>
                <button
                  type="button"
                  className="history-result"
                  onClick={() => onUse(it.result, true)}
                  title="Use this result"
                >
                  {formatNumbers(it.result, numStyle)}
                </button>
                <span className="history-time">
                  <IconClock />
                  {when(it.created_at)}
                </span>
              </div>

              <div className="hmenu-wrap">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setMenu(menu === it.id ? null : it.id)}
                  aria-label="Entry options"
                  aria-expanded={menu === it.id}
                >
                  <IconDots />
                </button>
                {menu === it.id && (
                  <div className="hpop" role="menu">
                    <button type="button" onClick={() => { onUse(it.result, true); setMenu(null); }}>
                      Use result
                    </button>
                    <button type="button" onClick={() => { onUse(it.expression, false); setMenu(null); }}>
                      Use expression
                    </button>
                    <button type="button" onClick={() => { copyText(it.result); setMenu(null); }}>
                      Copy result
                    </button>
                    <button type="button" className="danger" onClick={() => { onDelete(it.id); setMenu(null); }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {items.length > 0 && (
          <button type="button" className="history-clear" onClick={onClear}>
            <IconTrash />
            Clear History
          </button>
        )}
      </div>
    </aside>
  );
}