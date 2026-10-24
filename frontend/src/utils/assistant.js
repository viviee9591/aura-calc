import { parseSpoken } from "./voice.js";
import { cleanExpression, evaluate } from "./calc.js";
import { toSpeech } from "./speak.js";

// ---------- 1. Quick maths questions ----------
const NUM = "(\\d+(?:\\.\\d+)?)";
const TRIG = {
  sine: "sin", sin: "sin", cosine: "cos", cos: "cos", tangent: "tan", tan: "tan",
};

const SPECIALS = [
  [new RegExp(`(?:square root|sqrt|root)\\s+(?:of\\s+)?${NUM}`), (m) => `√${m[1]}`],
  [new RegExp(`${NUM}\\s+(?:squared|square)\\b`), (m) => `${m[1]}^2`],
  [new RegExp(`${NUM}\\s+cubed`), (m) => `${m[1]}^3`],
  [
    new RegExp(`${NUM}\\s+(?:to the power of|to the power|power)\\s+${NUM}`),
    (m) => `${m[1]}^${m[2]}`,
  ],
  [
    new RegExp(`factorial\\s+(?:of\\s+)?(\\d+)|(\\d+)\\s+factorial`),
    (m) => `${m[1] || m[2]}!`,
  ],
  [
    new RegExp(`(sine|sin|cosine|cos|tangent|tan)\\s+(?:of\\s+)?${NUM}`),
    (m) => `${TRIG[m[1]]}(${m[2]})`,
  ],
];

function run(expr) {
  try {
    const clean = cleanExpression(expr);
    const result = evaluate(clean, "deg");
    const trig = /sin|cos|tan/.test(clean);
    return {
      text: `${clean} = ${result}${trig ? " (degrees)" : ""}`,
      say: `${toSpeech(clean)} equals ${toSpeech(result)}${trig ? " degrees" : ""}`,
    };
  } catch (e) {
    return e.message === "Can't divide by zero"
      ? { text: e.message, say: e.message }
      : null;
  }
}

function solve(q) {
  const lower = q.toLowerCase();
  for (const [re, build] of SPECIALS) {
    const m = lower.match(re);
    if (m) {
      const out = run(build(m));
      if (out) return out;
    }
  }
  // "what is 7 plus 8", "25 percent of 480", "100 divided by 4"
  const { expression } = parseSpoken(lower);
  if (/\d/.test(expression) && /[+\-×÷%^()]/.test(expression)) return run(expression);
  return null;
}

// ---------- 2. Questions about the calculator (backup answers) ----------
const KB = [
  {
    k: ["hi", "hello", "hey", "namaste", "good morning", "good evening"],
    a: "Hello! I'm the Aurelia assistant. Ask me about any key, or ask a maths question like 15 percent of 200.",
  },
  {
    k: ["thanks", "thank you", "thank"],
    a: "You're welcome! Ask me anything else about the calculator.",
  },
      {
    k: ["what can you do", "help", "who are you", "what are you", "your name", "features", "what is this app", "aurelia", "this app", "this calculator"],
    a: "I'm Aurelia, your number whisperer. I can solve sums, explain any key, read answers aloud and listen when you speak. Try asking: what is M+?",
  },
  {
    k: ["ac", "all clear", "clear", "clear screen", "clear display"],
    a: "AC means All Clear. It wipes the whole display and the small line above it. Memory is not touched.",
  },
  {
    k: ["del", "delete", "backspace", "erase"],
    a: "DEL deletes one character at a time, like a backspace. On the keyboard, use the Backspace key.",
  },
  {
    k: ["percent", "percentage", "per cent"],
    a: "The percent key divides the number before it by 100, so 50% is 0.5. You can also type 200 × 10% to get 20.",
  },
  {
    k: ["bracket", "brackets", "parenthesis", "parentheses"],
    a: "Brackets make part of a sum happen first. (2+3)×4 is 20, but 2+3×4 is 14. The ( ) key opens or closes a bracket for you, and open brackets close automatically when you press equals.",
  },
  {
    k: ["memory", "piggy bank"],
    a: "Memory works like a small piggy bank. M+ puts the number on screen in, M− takes it out, MR shows what is inside, and MC empties it. AC does not clear memory. A small M badge shows when memory has a number.",
  },
  {
    k: ["mplus"],
    a: "M+ adds the number on the display into memory. Type 50, press M+, then AC, type 20 and press M+. Memory now holds 70. Press MR to see it.",
  },
  {
    k: ["mminus"],
    a: "M− subtracts the number on the display from memory. If memory holds 70, type 20 and press M−, and memory becomes 50.",
  },
  {
    k: ["mr", "memory recall", "recall"],
    a: "MR means Memory Recall. It types the number stored in memory onto the display.",
  },
  {
    k: ["mc", "memory clear", "clear memory"],
    a: "MC means Memory Clear. It empties memory, and the M badge disappears.",
  },
  {
    k: ["ans", "last answer", "previous answer", "answer key"],
    a: "Ans types your last answer into a new sum. If your last result was 14, press Ans, then × 2 and equals to get 28. On the keyboard, press the A key.",
  },
  {
    k: ["history", "past calculations", "previous calculations", "saved calculations", "delete history", "clear history", "clear all history", "mysql", "database"],
    a: "History saves every calculation in a MySQL database. Tap the clock button at the top to open it. Tap a result to reuse it, tap the trash icon to delete one, or press Clear All History to remove everything.",
  },
  {
    k: ["theme", "themes", "dark mode", "light mode", "pink mode", "pink", "dark", "light", "colour", "color", "colors"],
    a: "Tap one of the three circles at the top to switch theme: Light, Dark or Pink. Your choice is saved, so it stays after a refresh.",
  },
  {
    k: ["sound", "click", "vibration", "haptic", "mute", "beep"],
    a: "The Sound chip turns the key click and vibration on or off. It is separate from Read aloud.",
  },
  {
    k: ["format", "comma", "commas", "indian", "lakh", "number style", "separator"],
    a: "The number format chip changes how big numbers look: 1234567, 1,234,567, or Indian style 12,34,567. It only changes the display. The maths stays the same.",
  },
  {
    k: ["read aloud", "read", "reads", "read out", "readout", "announce", "say the answer", "speak the answer", "talk", "talking"],
    a: "Read aloud makes me say every key you press and every answer. Turn it on or off with the Read aloud chip or the switch in this panel. Press Stop to silence me at any time.",
  },
  {
    k: ["stop", "stop talking", "be quiet", "quiet", "silence", "shut up", "pause"],
    a: "Press the red Stop button at the top any time and I will stop talking. To stop me reading keys completely, switch off Read aloud.",
  },
  {
    k: ["mic", "microphone", "voice", "voice input", "voice typing", "dictate", "speech"],
    a: "Tap the mic on the display, then say a sum like two plus three times four. I will type it and work out the answer. You can also tap the mic here to ask me a question.",
  },
  {
    k: ["scientific", "science", "sci"],
    a: "Tap the Scientific chip to show extra keys like sin, cos, tan, log, ln, square root, powers and factorial. Press the function key first, then the number, then equals.",
  },
  {
    k: ["sin", "cos", "tan", "sine", "cosine", "tangent", "trigonometry", "trig"],
    a: "sin, cos and tan are trigonometry keys. Press the key, type an angle, then press equals. In DEG mode, sin 30 is 0.5.",
  },
  {
    k: ["deg", "rad", "degree", "degrees", "radian", "radians"],
    a: "DEG uses degrees and RAD uses radians. Tap the DEG key to switch. Use DEG for normal school maths, and RAD when angles are written with pi.",
  },
  {
    k: ["2nd", "second", "inverse", "arcsin", "arccos", "arctan"],
    a: "The 2nd key swaps the keys: sin becomes inverse sin, cos becomes inverse cos, tan becomes inverse tan, ln becomes e to the power x, and log becomes 10 to the power x. It switches itself off after one use.",
  },
  {
    k: ["log", "ln", "logarithm", "natural log"],
    a: "log is the base 10 logarithm, so log 1000 is 3. ln is the natural log with base e, so ln e is 1.",
  },
  {
    k: ["pi", "euler"],
    a: "π is pi, about 3.14159. Press π, or type 2 then π for 2 times pi. In scientific mode you can also press the P key.",
  },
  {
    k: ["factorial"],
    a: "n! is factorial. 5! means 5×4×3×2×1, which is 120. Type the number first, then press n!.",
  },
  {
    k: ["sqrt", "square root", "root"],
    a: "√ is the square root. Press √ then the number. √16 is 4. The square root of a negative number shows an error.",
  },
  {
    k: ["power", "squared", "exponent", "reciprocal", "one over x"],
    a: "x² squares the number before it, xʸ raises it to any power, and 1/x gives the reciprocal. So 4 x² is 16, 2 xʸ 10 is 1024, and 4 1/x is 0.25.",
  },
  {
    k: ["abs", "absolute"],
    a: "|x| is the absolute value. It removes the minus sign, so |−7| is 7.",
  },
  {
    k: ["copy", "clipboard", "copied"],
    a: "Tap the big number on the display to copy it. A small Copied message confirms it.",
  },
  {
    k: ["keyboard", "shortcut", "shortcuts"],
    a: "You can type on your keyboard. Numbers and operators work, Enter means equals, Backspace deletes, and Escape clears. A inserts the last answer. In scientific mode: S for sin, C for cos, T for tan, L for log, N for ln, R for root, and P for pi.",
  },
  {
    k: ["bodmas", "pemdas", "order of operations", "precedence"],
    a: "Aurelia follows BODMAS: brackets first, then powers, then multiply and divide, then add and subtract. So 2+3×4 is 14.",
  },
  {
    k: ["divide by zero", "divided by zero", "dividing by zero", "division by zero", "infinity"],
    a: "Dividing by zero is undefined in maths, so Aurelia shows an error instead of a number.",
  },
  {
    k: ["decimal", "dot", "point"],
    a: "The dot key adds a decimal point. Each number can have only one.",
  },
];

const FALLBACK =
  "Sorry, I don't know that one yet. Try asking about memory, history, themes or scientific mode, or give me a sum like 15 percent of 200.";

function normalize(q) {
  return q
    .toLowerCase()
    .replace(/\bm\s*\+/g, " mplus ")
    .replace(/\bm\s*[-−–]/g, " mminus ")
    .replace(/\bm plus\b/g, " mplus ")
    .replace(/\bm minus\b/g, " mminus ")
    .replace(/\bmemory plus\b/g, " mplus ")
    .replace(/\bmemory minus\b/g, " mminus ")
    .replace(/%/g, " percent ")
    .replace(/π/g, " pi ")
    .replace(/√/g, " sqrt ")
    .replace(/[()]/g, " bracket ")
    .replace(/\bn!/g, " factorial ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------- 3. Date and time (answered from your computer's clock) ----------
function dateTimeAnswer(q) {
  const t = q.toLowerCase();

  // "what day was 2 Oct 2020", "date of independence", "time complexity" are other questions
  if (/\d/.test(t)) return null;
  if (
    /\b(independence|republic|birthday|born|founded|history|complexity|zone|travel|limit|management|table|period)\b/.test(t) ||
    /\b(date|day|time)\s+(of|in|on|for|when)\b/.test(t)
  ) {
    return null;
  }

  const now = new Date();

  const ask = /\b(what|whats|wat|wts|whts|which|tell|say|show|give|current|todays|today)\b/.test(t);
  const nowish = /\b(today|todays|tdy|current|currently|now|present|right now|is it|its)\b/.test(t);

  const hasTime = /\btime\b/.test(t);
  const hasDay = /\b(date|dates|day|days)\b/.test(t);
  const hasYear = /\byear\b/.test(t);
  const hasMonth = /\bmonth\b/.test(t);

  if (hasTime && (ask || nowish)) {
    const time = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    return { text: `It's ${time}.`, kind: "math" };
  }
  if (hasDay && (ask || nowish)) {
    const date = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { text: `Today is ${date}.`, kind: "math" };
  }
  if (hasYear && (ask || nowish)) {
    return { text: `It's ${now.getFullYear()}.`, kind: "math" };
  }
  if (hasMonth && (ask || nowish)) {
    const month = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    return { text: `It's ${month}.`, kind: "math" };
  }
  return null;
}

// ---------- 4. The one function the app uses ----------
// kind = "math"  -> answered on your computer (no AI needed)
// kind = "kb"    -> a built-in answer (used as a backup)
// kind = "none"  -> nothing matched
export function answerQuestion(question) {
  const clock = dateTimeAnswer(question);
  if (clock) return clock;

  const solved = solve(question);
  if (solved) return { ...solved, kind: "math" };

  const padded = ` ${normalize(question)} `;
  let best = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const key of entry.k) {
      if (padded.includes(` ${key} `)) score += key.split(" ").length;
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best
    ? { text: best.a, kind: "kb" }
    : { text: FALLBACK, kind: "none" };
}