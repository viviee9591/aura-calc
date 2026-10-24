import { useEffect, useRef, useState } from "react";
import Calculator from "./components/Calculator.jsx";
import History from "./components/History.jsx";
import Assistant from "./components/Assistant.jsx";
import SettingsMenu from "./components/SettingsMenu.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import { Lotus, IconHistory, IconSun, IconMoon } from "./components/Icons.jsx";
import { FORMATS, FORMAT_LABEL } from "./utils/format.js";
import { stopSpeaking } from "./utils/speak.js";
import {
  getHistory,
  saveHistory,
  deleteHistory,
  clearHistory,
} from "./utils/api.js";

const THEME_KEY = "aura-theme";
const SOUND_KEY = "aura-sound";
const FORMAT_KEY = "aura-format";
const MORE_KEY = "aura-more";
const VOICE_KEY = "aura-readaloud";
const VALID_THEMES = ["pink", "light", "dark"];

function readSetting(key, fallback, valid) {
  try {
    const saved = localStorage.getItem(key);
    return valid.includes(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked, ignore */
  }
}

export default function App() {
  const [theme, setTheme] = useState(() =>
    readSetting(THEME_KEY, "pink", VALID_THEMES)
  );
  const [soundOn, setSoundOn] = useState(
    () => readSetting(SOUND_KEY, "on", ["on", "off"]) === "on"
  );
  const [numStyle, setNumStyle] = useState(() =>
    readSetting(FORMAT_KEY, "intl", FORMATS)
  );
  const [more, setMore] = useState(
    () => readSetting(MORE_KEY, "off", ["on", "off"]) === "on"
  );
  const [readAloud, setReadAloud] = useState(
    () => readSetting(VOICE_KEY, "on", ["on", "off"]) === "on"
  );
  const [assistantOpen, setAssistantOpen] = useState(
    () => window.innerWidth > 900
  );

  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [recall, setRecall] = useState(null);

  // the light theme the toggle returns to when leaving dark
  const lastLight = useRef(theme === "dark" ? "pink" : theme);

  useEffect(() => {
    if (theme !== "dark") lastLight.current = theme;
    saveSetting(THEME_KEY, theme);
  }, [theme]);
  useEffect(() => saveSetting(SOUND_KEY, soundOn ? "on" : "off"), [soundOn]);
  useEffect(() => saveSetting(FORMAT_KEY, numStyle), [numStyle]);
  useEffect(() => saveSetting(MORE_KEY, more ? "on" : "off"), [more]);
  useEffect(() => saveSetting(VOICE_KEY, readAloud ? "on" : "off"), [readAloud]);

  // load history from MySQL once
  useEffect(() => {
    getHistory()
      .then((rows) => {
        setHistory(rows);
        setApiError(false);
      })
      .catch(() => setApiError(true));
  }, []);

  const toggleDark = () =>
    setTheme((t) => (t === "dark" ? lastLight.current : "dark"));
  const goLight = () => setTheme(lastLight.current);
  const goDark = () => setTheme("dark");

  const cycleFormat = () =>
    setNumStyle((s) => FORMATS[(FORMATS.indexOf(s) + 1) % FORMATS.length]);

  const toggleRead = () => {
    if (readAloud) stopSpeaking();
    setReadAloud((r) => !r);
  };

  const handleSave = async (expression, result) => {
    try {
      const saved = await saveHistory(expression, result);
      setHistory((list) => [saved, ...list]);
      setApiError(false);
    } catch {
      setApiError(true);
    }
  };

  const handleUse = (value, isResult) => {
    setRecall({ value, fresh: isResult, n: Date.now() });
    if (window.innerWidth <= 880) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      await deleteHistory(id);
      setHistory((list) => list.filter((item) => item.id !== id));
    } catch {
      setApiError(true);
    }
  };

  const handleClear = async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch {
      setApiError(true);
    }
  };

  return (
    <div className="app" data-theme={theme}>
      <div className="petals" aria-hidden="true">
        <span className="petal" />
        <span className="petal" />
        <span className="petal" />
        <span className="petal" />
      </div>

      <header className="topbar">
        <div className="brand">
          <Lotus />
          <div className="brand-text">
            <span className="brand-name">AURELIA</span>
            <span className="brand-tag">CALCULATOR</span>
          </div>
        </div>

        <div className="nav">
          <button
            type="button"
            className={`nav-btn ${historyOpen ? "on" : ""}`}
            onClick={() => setHistoryOpen((o) => !o)}
            aria-pressed={historyOpen}
          >
            <IconHistory />
            <span>History</span>
          </button>

          <span className="nav-div" />

          <div className="theme-toggle">
            <button
              type="button"
              className={`tt-icon ${theme !== "dark" ? "on" : ""}`}
              onClick={goLight}
              aria-label="Light theme"
              title="Light theme"
            >
              <IconSun />
            </button>
            <button
              type="button"
              className="tt-track"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Switch between light and dark"
              onClick={toggleDark}
            >
              <span className="tt-knob" />
            </button>
            <button
              type="button"
              className={`tt-icon ${theme === "dark" ? "on" : ""}`}
              onClick={goDark}
              aria-label="Dark theme"
              title="Dark theme"
            >
              <IconMoon />
            </button>
          </div>

          <SettingsMenu
            theme={theme}
            onTheme={setTheme}
            formatLabel={FORMAT_LABEL[numStyle]}
            onCycleFormat={cycleFormat}
            soundOn={soundOn}
            onSound={() => setSoundOn((s) => !s)}
            readAloud={readAloud}
            onRead={toggleRead}
            more={more}
            onMore={() => setMore((m) => !m)}
            onOpenAssistant={() => setAssistantOpen(true)}
          />
        </div>
      </header>

      <OfflineBanner />

      <main className="stage">
        <div className={`layout ${historyOpen ? "two" : ""}`}>
          <section className="calc-card">
            <Calculator
              onSave={handleSave}
              recall={recall}
              soundOn={soundOn}
              numStyle={numStyle}
              more={more}
              readAloud={readAloud}
              onToggleAssistant={() => setAssistantOpen((o) => !o)}
            />
          </section>

          <History
            items={history}
            open={historyOpen}
            error={apiError}
            numStyle={numStyle}
            onUse={handleUse}
            onDelete={handleDelete}
            onClear={handleClear}
          />
        </div>
      </main>

      <Assistant
        open={assistantOpen}
        onClose={() => {
          stopSpeaking();
          setAssistantOpen(false);
        }}
        readAloud={readAloud}
        onToggleRead={toggleRead}
      />
    </div>
  );
}