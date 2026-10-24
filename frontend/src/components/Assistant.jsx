import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking, onSpeaking } from "../utils/speak.js";
import { answerQuestion } from "../utils/assistant.js";
import { askAI } from "../utils/api.js";
import useOnline from "../utils/useOnline.js";

const SR =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const LANG = "en-IN"; // if the mic fails often, try "en-US"
const GREETING = "Hello! What would you like to calculate?";
const QUICK = ["25% of 480", "Explain M+ simply", "Square root of 144"];

const OFFLINE_REPLY =
  "You're offline right now. I can still solve sums and explain the calculator's keys. Reconnect to ask anything else.";

const MIC_ERRORS = {
  "not-allowed": "Allow the microphone in your browser",
  "service-not-allowed": "Allow the microphone in your browser",
  "no-speech": "Didn't hear anything, try again",
  "audio-capture": "No microphone found",
  network: "Voice needs an internet connection",
};

// short messages like "tell in simple", "example", "more", "why" are about the last answer
const FOLLOW_UP =
  /\b(simpl\w*|simple|easy|easier|eli5|example\w*|again|more|explain\w*|elaborate|detail\w*|why|how|shorter|clearer|clear|tell|tll|tel|say|repeat|meaning|mean)\b/i;

export default function Assistant({ open, onClose, readAloud, onToggleRead }) {
  const online = useOnline();
  const [messages, setMessages] = useState([{ role: "ai", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [micMsg, setMicMsg] = useState("");

  const chatRef = useRef(null);
  const recRef = useRef(null);
  const greeted = useRef(false);
  const openRef = useRef(open);
  const msgRef = useRef(messages);
  const askRef = useRef(null);
  const busy = useRef(false);
  const aiOff = useRef(false); // true when the server has no API key
  const heard = useRef("");
  const asked = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    msgRef.current = messages;
  }, [messages]);

  // know when the voice is talking (to show the Stop button)
  useEffect(() => onSpeaking(setSpeaking), []);

  // keep the newest message in view
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, thinking]);

  // mic messages disappear by themselves
  useEffect(() => {
    if (!micMsg) return;
    const t = setTimeout(() => setMicMsg(""), 3500);
    return () => clearTimeout(t);
  }, [micMsg]);

  // browsers only allow talking after a click or key press,
  // so the greeting is spoken on your first interaction
  useEffect(() => {
    const first = (e) => {
      if (greeted.current) return;
      greeted.current = true;
      window.removeEventListener("pointerdown", first, true);
      window.removeEventListener("keydown", first, true);
      if (!openRef.current) return;
      if (e.target.closest && e.target.closest(".as-close")) return;
      speak(GREETING);
    };
    window.addEventListener("pointerdown", first, true);
    window.addEventListener("keydown", first, true);
    return () => {
      window.removeEventListener("pointerdown", first, true);
      window.removeEventListener("keydown", first, true);
    };
  }, []);

  // stop listening if the component disappears
  useEffect(() => () => recRef.current?.abort(), []);

  const reply = (a) => {
    setMessages((m) =>
      [...m, { role: "ai", text: a.text, say: a.say }].slice(-30)
    );
    speak(a.say || a.text);
  };

  const ask = async (question) => {
    const q = question.trim();
    if (!q || busy.current) return;
    stopSpeaking();

    // earlier messages (without the greeting) so follow-ups make sense
    const before = msgRef.current.slice(1);
    const history = before.slice(-6).map((m) => ({
      role: m.role === "me" ? "user" : "assistant",
      content: m.text,
    }));

    // a short follow-up ("tell in simple") gets the last answer attached,
    // so the AI always knows what it is about
    const lastAI = [...before].reverse().find((m) => m.role === "ai");
    const isFollowUp = q.split(/\s+/).length <= 8 && FOLLOW_UP.test(q);
    const aiQuestion =
      isFollowUp && lastAI
        ? `${q}\n\n(This is a follow-up about your previous answer, and it may have typos. Your previous answer was: "${lastAI.text.slice(0, 450)}")`
        : q;

    setMessages((m) => [...m, { role: "me", text: q }].slice(-30));

    const local = answerQuestion(q);

    // sums, dates and remainders are solved on your computer, instantly
    if (local.kind === "math" || aiOff.current) {
      reply(local);
      return;
    }

    // no internet: use a built-in answer if there is one, otherwise say so plainly
    if (!navigator.onLine) {
      reply(local.kind === "kb" ? local : { text: OFFLINE_REPLY });
      return;
    }

    busy.current = true;
    setThinking(true);
    try {
      const text = await askAI(aiQuestion, history);
      reply({ text: text || local.text });
    } catch (e) {
      if (e.status === 503) aiOff.current = true;
      if (!navigator.onLine) {
        reply(local.kind === "kb" ? local : { text: OFFLINE_REPLY });
      } else {
        reply({
          text:
            e.status === 503
              ? "My AI brain is not set up yet. Add GROQ_API_KEY to the backend .env and restart the backend."
              : e.message,
        });
      }
    } finally {
      busy.current = false;
      setThinking(false);
    }
  };
  askRef.current = ask; // the mic always calls the newest version

  const submit = (e) => {
    e.preventDefault();
    if (busy.current) return;
    ask(draft);
    setDraft("");
  };

  const toggleListen = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    if (!navigator.onLine) {
      setMicMsg("Voice needs an internet connection");
      return;
    }
    stopSpeaking(); // so it does not hear itself
    setMicMsg("");
    heard.current = "";
    asked.current = false;

    const rec = new SR();
    rec.lang = LANG;
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => setListening(true);

    rec.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      heard.current = t;
      setDraft(t);
      if (e.results[e.results.length - 1].isFinal && !asked.current) {
        asked.current = true;
        setDraft("");
        askRef.current(t);
      }
    };

        rec.onerror = (e) => {
      setListening(false);
      if (e.error === "aborted") return;
      if (e.error === "network") recheck();
      setMicMsg(
        e.error === "network"
          ? "Can't reach the voice service. Check your connection."
          : MIC_ERRORS[e.error] || `Voice error (${e.error})`
      );
    };

    rec.onend = () => {
      setListening(false);
      // stopped by hand before the final result: still use what was heard
      if (!asked.current && heard.current.trim()) {
        asked.current = true;
        setDraft("");
        askRef.current(heard.current);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setMicMsg("Mic is busy, try again");
    }
  };

  return (
    <>
      {/* red Stop button, shown only while the assistant is talking */}
      {speaking && (
        <button type="button" className="stop-pill" onClick={stopSpeaking}>
          <span className="stop-sq" />
          Stop
        </button>
      )}

      <aside
        className={`assistant ${open ? "open" : ""}`}
        aria-label="AI Assistant"
      >
        <header className="as-head">
          <div className="as-title">
            <span className="as-spark">✦</span>
            <span>AI ASSISTANT</span>
          </div>
          <button
            type="button"
            className="as-close"
            onClick={onClose}
            aria-label="Close assistant"
          >
            ✕
          </button>
        </header>

        <div className="as-chat" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.text}
              {m.role === "ai" && (
                <button
                  type="button"
                  className="bubble-replay"
                  onClick={() => speak(m.say || m.text)}
                  aria-label="Read this again"
                  title="Read this again"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {thinking && (
            <div className="bubble ai typing" aria-label="Thinking">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="as-quick">
          {QUICK.map((q) => (
            <button key={q} type="button" className="chip" onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>

        {!online && (
          <p className="as-offline">
            You're offline. Sums and calculator help still work.
          </p>
        )}
        {micMsg && <p className="as-mic-msg">{micMsg}</p>}

        <form className="as-input" onSubmit={submit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={listening ? "Listening…" : "Ask me to calculate…"}
            aria-label="Ask the assistant"
          />
          {SR && (
            <button
              type="button"
              className={`as-btn ${listening ? "listening" : ""}`}
              onClick={toggleListen}
              aria-label={listening ? "Stop listening" : "Ask by voice"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}
          <button type="submit" className="as-btn send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>

        <div className="as-foot">
          <span>Read aloud keys &amp; answers</span>
          <button
            type="button"
            className={`switch ${readAloud ? "on" : ""}`}
            role="switch"
            aria-checked={readAloud}
            onClick={onToggleRead}
            aria-label="Read aloud"
          >
            <span className="switch-knob" />
          </button>
        </div>
      </aside>
    </>
  );
}