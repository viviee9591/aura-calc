const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

// false = voices installed on your computer (instant, reliable)
// true  = online "Natural" voices (nicer, but slower and can fail)
const PREFER_ONLINE = true;

let voice = null;
let gen = 0; // every new speech gets a number, old ones are ignored
let speaking = false;
let timer = null;
const listeners = new Set();

function setSpeaking(v) {
  if (speaking === v) return;
  speaking = v;
  listeners.forEach((fn) => fn(v));
}

// lets a component know when the voice starts or stops
export function onSpeaking(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// voices load late in some browsers, so we pick again when they arrive
function loadVoice() {
  if (!synth) return;
  const list = synth
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!list.length) return;

  const score = (v) => {
    const lang = v.lang.replace("_", "-");
    let s = lang === "en-IN" ? 3 : lang === "en-US" ? 2 : lang === "en-GB" ? 1 : 0;
    if (PREFER_ONLINE ? !v.localService : v.localService) s += 10;
    return s;
  };
  voice = [...list].sort((a, b) => score(b) - score(a))[0];
}
if (synth) {
  loadVoice();
  synth.addEventListener("voiceschanged", loadVoice);
}

// make symbols easy to pronounce
function forSpeech(t) {
  return String(t)
    .replace(/\bM\+/g, "M plus")
    .replace(/\bM[−–-]/g, "M minus")
    .replace(/\bMC\b/g, "M C")
    .replace(/\bMR\b/g, "M R")
    .replace(/\bAC\b/g, "A C")
    .replace(/\bDEL\b/g, "delete")
    .replace(/\bDEG\b/g, "degrees")
    .replace(/\bRAD\b/g, "radians")
    .replace(/\bAns\b/g, "answer")
    .replace(/\|x\|/g, "absolute value")
    .replace(/xʸ/g, "x to the power y")
    .replace(/x²/g, "x squared")
    .replace(/1\/x/g, "one over x")
    .replace(/n!/g, "n factorial")
    .replace(/(\d)!/g, "$1 factorial")
    .replace(/√/g, " square root of ")
    .replace(/π/g, " pi ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/%/g, " percent ")
    .replace(/=/g, " equals ")
    .replace(/[✦•→*`_#]/g, " ");
}

// "2+3×4" -> "2 plus 3 times 4"
export function toSpeech(expr) {
  return String(expr)
    .replace(/asin\(/g, " inverse sine of (")
    .replace(/acos\(/g, " inverse cosine of (")
    .replace(/atan\(/g, " inverse tangent of (")
    .replace(/sin\(/g, " sine of (")
    .replace(/cos\(/g, " cosine of (")
    .replace(/tan\(/g, " tangent of (")
    .replace(/ln\(/g, " natural log of (")
    .replace(/log\(/g, " log of (")
    .replace(/abs\(/g, " absolute value of (")
    .replace(/√/g, " square root of ")
    .replace(/\^/g, " to the power of ")
    .replace(/\(/g, " open bracket ")
    .replace(/\)/g, " close bracket ")
    .replace(/%/g, " percent ")
    .replace(/!/g, " factorial ")
    .replace(/π/g, " pi ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/\+/g, " plus ")
    .replace(/-/g, " minus ")
    .replace(/\s+/g, " ")
    .trim();
}

// long text is cut into sentences (Chrome stops talking after ~15 seconds otherwise)
function chunks(text) {
  const parts = text.match(/[^.!?]+[.!?]*/g) || [text];
  const out = [];
  let cur = "";
  for (const p of parts) {
    if ((cur + p).length > 160 && cur) {
      out.push(cur.trim());
      cur = p;
    } else {
      cur += p;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function say(text) {
  const myGen = ++gen;
  const queue = chunks(forSpeech(text)).filter(Boolean);
  if (!queue.length) return;

  const start = () => {
    if (myGen !== gen) return; // something newer came in
    synth.resume();
    setSpeaking(true);
    queue.forEach((piece, i) => {
      const u = new SpeechSynthesisUtterance(piece);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "en-IN";
      }
      u.rate = 1.05;
      const finish = () => {
        if (myGen === gen && i === queue.length - 1) setSpeaking(false);
      };
      u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
    });
  };

  // cancel + speak in the same instant gets dropped, so we wait a moment
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(start, 60);
  } else {
    start();
  }
}

export function speak(text) {
  if (!synth || !text) return;
  clearTimeout(timer);
  timer = setTimeout(() => say(String(text)), 80); // fast typing = only the last key
}

export function stopSpeaking() {
  gen++;
  clearTimeout(timer);
  if (synth) synth.cancel();
  setSpeaking(false);
}

// what to say for each key
const KEY_WORDS = {
  "+": "plus", "-": "minus", "×": "times", "÷": "divided by",
  "%": "percent", ".": "point", "(": "open bracket", ")": "close bracket",
  "()": "bracket", AC: "all clear", DEL: "delete",
  MC: "memory clear", MR: "memory recall", "M+": "memory plus", "M-": "memory minus",
  ANS: "answer", "π": "pi", "√": "square root", SQ: "squared",
  RECIP: "reciprocal", "!": "factorial", "^": "power", INV: "second function",
  ANGLE: "angle mode", sin: "sine", cos: "cosine", tan: "tangent",
  asin: "inverse sine", acos: "inverse cosine", atan: "inverse tangent",
  ln: "natural log", log: "log", abs: "absolute value",
  EXP: "e to the power", POW10: "ten to the power",
};

export const sayKey = (key) => speak(KEY_WORDS[key] ?? key);
export const sayText = (text) => speak(text);
export const sayResult = (expression, result) =>
  speak(`${toSpeech(expression)} equals ${toSpeech(result)}`);