import { useEffect, useRef, useState } from "react";
import Display from "./Display.jsx";
import Keypad from "./Keypad.jsx";
import VoiceButton from "./VoiceButton.jsx";
import { OPS, cleanExpression, evaluate } from "../utils/calc.js";
import { parseSpoken } from "../utils/voice.js";
import { tap, copyText } from "../utils/feedback.js";
import { sayKey, sayResult, sayText } from "../utils/speak.js";

const MAX_LEN = 80;
const AUTO_CALCULATE = true; // false = voice only types, you press = yourself
const count = (s, ch) => s.split(ch).length - 1;
const wrapNeg = (v) => (String(v).startsWith("-") ? `(${v})` : String(v));

const VALUE_END = /[\d)%!πe]$/; // the text ends with a "value"
const POST_END = /[)%!πe]$/; // same, but not a plain digit
const FUNC_KEYS = ["sin", "cos", "tan", "asin", "acos", "atan", "ln", "log", "abs", "√"];

export default function Calculator({
  onSave,
  recall,
  soundOn,
  numStyle,
  more,
  readAloud,
  onToggleAssistant,
}) {
  const [expr, setExpr] = useState("");
  const [prev, setPrev] = useState("");
  const [fresh, setFresh] = useState(false);
  const [error, setError] = useState("");
  const [ans, setAns] = useState(null);
  const [memory, setMemory] = useState(null);

  // angle mode: "deg" -> "rad" -> "off" -> "deg"
  const [angleMode, setAngleMode] = useState("deg");
  // what the maths really uses (when the mode is off, degrees are used)
  const angle = angleMode === "rad" ? "rad" : "deg";

  const [inv, setInv] = useState(false); // 2nd key
  const [toast, setToast] = useState({ text: "", show: false });
  const toastTimer = useRef(null);

  const flash = (text) => {
    clearTimeout(toastTimer.current);
    setToast({ text, show: true });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      1400
    );
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // history tap: load an expression or a result
  useEffect(() => {
    if (!recall) return;
    setError("");
    setPrev("");
    setExpr(recall.value.slice(0, MAX_LEN));
    setFresh(recall.fresh);
  }, [recall]);

  const commit = (value) => {
    if (value.length > MAX_LEN) return;
    setExpr(value);
    setFresh(false);
  };

  const currentValue = () => {
    if (error) return null;
    const clean = cleanExpression(expr);
    if (!clean) return null;
    try {
      return parseFloat(evaluate(clean, angle));
    } catch {
      return null;
    }
  };

  // type a value, constant or function (adds × when needed)
  const insertValue = (text) => {
    let cur = error ? "" : expr;
    const wasFresh = error ? false : fresh;
    if (error) {
      setError("");
      setPrev("");
    }
    if (wasFresh) cur = "";
    else if (VALUE_END.test(cur) || /\.$/.test(cur)) cur += "×";
    commit(cur + text);
  };

  const press = (input) => {
    tap(soundOn);
    if (readAloud && input !== "=") sayKey(input);

    let key = input;

    // ----- scientific switches (never clear the display) -----
    if (key === "INV") {
      setInv((v) => !v);
      return;
    }
    if (key === "ANGLE") {
      const next =
        angleMode === "deg" ? "rad" : angleMode === "rad" ? "off" : "deg";
      setAngleMode(next);
      flash(
        next === "deg"
          ? "Degrees"
          : next === "rad"
          ? "Radians"
          : "Angle mode off (degrees used)"
      );
      return;
    }

    let cur = expr;
    let wasFresh = fresh;

    // after an error, the next key starts clean
    if (error) {
      cur = "";
      wasFresh = false;
      setError("");
      setPrev("");
      setExpr("");
      setFresh(false);
      if (["AC", "DEL", "="].includes(key)) return;
    }

    // ----- AC -----
    if (key === "AC") {
      setExpr("");
      setPrev("");
      setFresh(false);
      return;
    }

    // ----- DEL: removes "sin(" as one piece, anything else one character -----
    if (key === "DEL") {
      setExpr(
        cur.replace(
          /(?:asin|acos|atan|sin|cos|tan|log|ln|abs|√)\($|[\s\S]$/,
          ""
        )
      );
      setFresh(false);
      return;
    }

    // ----- memory keys -----
    if (key === "MC") {
      setMemory(null);
      flash("Memory cleared");
      return;
    }
    if (key === "MR") {
      if (memory === null) {
        flash("Memory is empty");
        return;
      }
      insertValue(wrapNeg(memory));
      return;
    }
    if (key === "M+" || key === "M-") {
      const v = currentValue();
      if (v === null) {
        flash("Type a number first");
        return;
      }
      const next = (memory ?? 0) + (key === "M+" ? v : -v);
      setMemory(parseFloat(next.toPrecision(12)));
      flash(key === "M+" ? "Added to memory" : "Subtracted from memory");
      return;
    }

    // ----- Ans key -----
    if (key === "ANS") {
      if (ans === null) {
        flash("No answer yet");
        return;
      }
      insertValue(wrapNeg(ans));
      return;
    }

    // ----- = -----
    if (key === "=") {
      const clean = cleanExpression(cur);
      if (!clean) return;
      try {
        const result = evaluate(clean, angle);
        setPrev(`${clean} =`);
        setExpr(result);
        setAns(result);
        setFresh(true);
        if (readAloud) sayResult(clean, result);
        if (result !== clean && onSave) onSave(clean, result);
      } catch (e) {
        setPrev(`${clean} =`);
        setError(e.message);
        if (readAloud) sayText(e.message);
      }
      return;
    }

    // ----- scientific keys -----
    if (key === "π" || key === "e") return insertValue(key);

    if (FUNC_KEYS.includes(key)) {
      if (["asin", "acos", "atan"].includes(key)) setInv(false);
      return insertValue(key + "(");
    }
    if (key === "EXP") {
      setInv(false);
      return insertValue("e^(");
    }
    if (key === "POW10") {
      setInv(false);
      return insertValue("10^(");
    }

    // these act on the number before them (also after "=")
    if (key === "SQ") {
      if (VALUE_END.test(cur)) commit(cur + "^2");
      return;
    }
    if (key === "RECIP") {
      if (VALUE_END.test(cur)) commit(cur + "^(-1)");
      return;
    }
    if (key === "!") {
      if (VALUE_END.test(cur)) commit(cur + "!");
      return;
    }
    if (key === "^") {
      if (VALUE_END.test(cur)) commit(cur + "^");
      return;
    }

    // ----- digits -----
    if (/^\d$/.test(key)) {
      if (wasFresh) cur = "";
      const lastNum = cur.match(/[\d.]+$/)?.[0] ?? "";
      if (lastNum === "0") cur = cur.slice(0, -1); // no "05"
      if (POST_END.test(cur)) cur += "×";
      return commit(cur + key);
    }

    // ----- decimal point -----
    if (key === ".") {
      if (wasFresh) cur = "";
      const lastNum = cur.match(/[\d.]+$/)?.[0] ?? "";
      if (lastNum.includes(".")) return; // only one dot per number
      if (cur === "" || /[+\-×÷^(]$/.test(cur)) cur += "0";
      else if (POST_END.test(cur)) cur += "×0";
      return commit(cur + ".");
    }

    // ----- brackets -----
    if (key === "()") {
      const open = count(cur, "(") - count(cur, ")");
      key = !wasFresh && open > 0 && VALUE_END.test(cur) ? ")" : "(";
    }

    if (key === "(") {
      if (wasFresh) cur = "";
      else if (VALUE_END.test(cur)) cur += "×";
      return commit(cur + "(");
    }

    if (key === ")") {
      const open = count(cur, "(") - count(cur, ")");
      if (open > 0 && VALUE_END.test(cur)) commit(cur + ")");
      return;
    }

    // ----- percent -----
    if (key === "%") {
      if (VALUE_END.test(cur)) commit(cur + "%");
      return;
    }

    // ----- + - × ÷ -----
    if (OPS.includes(key)) {
      if (cur === "") {
        if (key === "-") commit("-"); // allow a negative start
        return;
      }
      if (cur === "-") return;

      const last = cur.slice(-1);

      if (last === "^") {
        if (key === "-") commit(cur + "-"); // 2^-3
        return;
      }

      if (last === "(") {
        if (key === "-") commit(cur + "-");
        return;
      }

      if (OPS.includes(last)) {
        if (key === "-" && (last === "×" || last === "÷")) {
          return commit(cur + "-"); // allows 5×-3
        }
        let base = cur.slice(0, -1);
        if (OPS.includes(base.slice(-1))) base = base.slice(0, -1);
        if (base === "" || base.endsWith("(")) return;
        return commit(base + key); // replace the old operator
      }

      return commit(cur + key);
    }
  };

  // ----- copy the big number -----
  const handleCopy = async () => {
    if (!expr || error) return;
    tap(soundOn);
    const ok = await copyText(expr);
    flash(ok ? "Copied" : "Copy failed");
  };

  // ----- voice input -----
  const handleVoice = (text) => {
    const { expression, calculate } = parseSpoken(text);
    if (!expression) return;

    setError("");
    setFresh(false);

    if (!(calculate || AUTO_CALCULATE)) {
      setPrev("");
      setExpr(expression.slice(0, MAX_LEN));
      return;
    }

    const clean = cleanExpression(expression);
    if (!clean) return;
    try {
      const result = evaluate(clean, angle);
      setPrev(`${clean} =`);
      setExpr(result);
      setAns(result);
      setFresh(true);
      if (readAloud) sayResult(clean, result);
      if (result !== clean && onSave) onSave(clean, result);
    } catch (e) {
      setExpr(clean);
      setPrev(`${clean} =`);
      setError(e.message);
      if (readAloud) sayText(e.message);
    }
  };

  // ----- keyboard support -----
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // typing in a text box (assistant, history search) must not press keys
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const k = e.key;
      let mapped = null;

      if (/^\d$/.test(k)) mapped = k;
      else if (k === "." || k === ",") mapped = ".";
      else if (k === "+") mapped = "+";
      else if (k === "-") mapped = "-";
      else if (k === "*" || k === "x" || k === "X") mapped = "×";
      else if (k === "/") mapped = "÷";
      else if (k === "%") mapped = "%";
      else if (k === "(" || k === ")") mapped = k;
      else if (k === "^") mapped = "^";
      else if (k === "!") mapped = "!";
      else if (k === "a" || k === "A") mapped = "ANS";
      else if (k === "Enter" || k === "=") mapped = "=";
      else if (k === "Backspace") mapped = "DEL";
      else if (k === "Escape" || k === "Delete") mapped = "AC";
      else if (k === "p") mapped = "π";
      else if (k === "e") mapped = "e";
      else if (k === "r") mapped = "√";
      else if (k === "s") mapped = "sin";
      else if (k === "c") mapped = "cos";
      else if (k === "t") mapped = "tan";
      else if (k === "l") mapped = "log";
      else if (k === "n") mapped = "ln";

      if (mapped) {
        e.preventDefault();
        press(mapped);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <VoiceButton onResult={handleVoice} onToggleAssistant={onToggleAssistant} />

      <div className="display-wrap">
        <Display
          prev={prev}
          value={expr}
          error={error}
          numStyle={numStyle}
          onCopy={handleCopy}
        />
        <div className="display-meta">
          {memory !== null && (
            <span className="meta-chip hot" title={`Memory: ${memory}`}>
              M {memory}
            </span>
          )}
          <button
            type="button"
            className="meta-chip"
            onClick={() => press("ANGLE")}
            title="Angle mode: tap to change"
          >
            {angleMode === "off" ? "OFF" : angleMode.toUpperCase()}
          </button>
          <button
            type="button"
            className="meta-chip"
            onClick={() => press("ANS")}
            title="Insert last answer"
          >
            Ans
          </button>
        </div>
        <div className={`toast ${toast.show ? "show" : ""}`}>{toast.text}</div>
      </div>

      <Keypad onPress={press} inv={inv} more={more} />
    </>
  );
}