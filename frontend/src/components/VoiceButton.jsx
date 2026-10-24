import { useEffect, useRef, useState } from "react";
import { stopSpeaking } from "../utils/speak.js";
import { useOnline, recheck } from "../utils/useOnline.js";
import { IconMic, IconSpark } from "./Icons.jsx";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const BARS = [10, 16, 26, 38, 24, 44, 56, 40, 26, 48, 34, 20, 30, 42, 24, 14, 10, 22, 34, 18, 10];

export default function VoiceButton({ onResult, onToggleAssistant }) {
  const online = useOnline();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const recRef = useRef(null);
  const timer = useRef(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      recRef.current?.abort();
    },
    []
  );

  // lost the connection while listening: stop quietly
  useEffect(() => {
    if (!online) recRef.current?.abort();
  }, [online]);

  const start = () => {
    if (!online) return;
    stopSpeaking(); // so the mic does not hear the app talking
    const rec = new SpeechRecognition();
    rec.lang = "en-IN"; // change to "en-US" if you prefer
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      clearTimeout(timer.current);
      setListening(true);
      setIsError(false);
      setStatus("Listening…");
    };

    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setStatus(text);
      if (e.results[e.results.length - 1].isFinal) onResultRef.current(text);
    };

    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setIsError(true);
      if (e.error === "not-allowed") setStatus("Allow the microphone");
      else if (e.error === "service-not-allowed") setStatus("Voice is blocked in this browser");
      else if (e.error === "no-speech") setStatus("Didn't hear anything");
      else if (e.error === "network") {
        setStatus("Can't reach voice service. Check your connection.");
        recheck(); // confirms it, and shows the offline strip if the internet is down
      } else setStatus(`Voice error (${e.error})`);
    };

    rec.onend = () => {
      setListening(false);
      timer.current = setTimeout(() => {
        setStatus("");
        setIsError(false);
      }, 3500);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setIsError(true);
      setStatus("Mic is busy, try again");
    }
  };

  const toggle = () => {
    if (listening) recRef.current?.stop();
    else start();
  };

  const sub = !online
    ? "You're offline. Voice needs internet."
    : status || "Ask a question or say a calculation";

  return (
    <div className="askbar">
      {SpeechRecognition ? (
        <button
          type="button"
          className={`mic ${listening ? "listening" : ""} ${!online ? "offline" : ""}`}
          onClick={toggle}
          disabled={!online}
          aria-label={
            !online ? "Voice is unavailable offline" : listening ? "Stop listening" : "Say a calculation"
          }
          title={!online ? "Voice needs internet" : "Say a calculation"}
        >
          <IconMic />
        </button>
      ) : (
        <button type="button" className="mic" onClick={onToggleAssistant} aria-label="Ask Aurelia">
          <IconSpark />
        </button>
      )}

      <button
        type="button"
        className="ask-text"
        onClick={onToggleAssistant}
        title="Open the AI assistant"
      >
        <span className="ask-title">Ask Aurelia</span>
        <span className={`ask-sub ${isError || !online ? "err" : ""}`}>{sub}</span>
      </button>

      <div className={`wave ${listening ? "on" : ""}`} aria-hidden="true">
        {BARS.map((h, i) => (
          <span key={i} style={{ height: h, "--i": i }} />
        ))}
      </div>
    </div>
  );
}