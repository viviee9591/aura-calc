const UNITS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};

const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const SCALES = {
  thousand: 1e3, lakh: 1e5, lakhs: 1e5, million: 1e6,
  crore: 1e7, crores: 1e7, billion: 1e9,
};

// spoken phrase -> symbol (order matters)
const PHRASES = [
  [/\b(open|left)\s+(bracket|brackets|parenthesis)\b/g, "("],
  [/\b(close|right)\s+(bracket|brackets|parenthesis)\b/g, ")"],
  [/\b(percent|percentage|per cent)\s+of\b/g, "% ×"],
  [/\b(percent|percentage|per cent)\b/g, "%"],
  [/\b(divided by|divide by|divided|divide|over)\b/g, "÷"],
  [/\b(multiplied by|multiply by|multiplied|multiply|times|into)\b/g, "×"],
  [/\bx\b/g, "×"],
  [/\b(plus|added to|add)\b/g, "+"],
  [/\b(minus|subtract|less)\b/g, "-"],
  [/\b(is equal to|equal to|equals|equal|calculate|result)\b/g, "="],
];

export function parseSpoken(raw) {
  let text = raw.toLowerCase().replace(/(\d),(?=\d{3})/g, "$1"); // 1,000 -> 1000

  for (const [regex, symbol] of PHRASES) {
    text = text.replace(regex, ` ${symbol} `);
  }

  text = text
    .replace(/[−–]/g, "-")
    .replace(/([+\-×÷*/()%=])/g, " $1 "); // space around symbols

  const tokens = text.split(/\s+/).filter(Boolean);

  let out = "";
  let calculate = false;
  let total = 0;
  let current = 0;
  let inWords = false;
  let decimal = false;

  // finish a number made from words: "twenty" "five" -> 25
  const flush = () => {
    if (inWords) {
      out += String(total + current);
      total = 0;
      current = 0;
      inWords = false;
    }
  };

  for (const t of tokens) {
    // after "point", digits are spoken one by one: "point one four" -> .14
    if (decimal) {
      if (t in UNITS && UNITS[t] < 10) {
        out += UNITS[t];
        continue;
      }
      if (/^\d+$/.test(t)) {
        out += t;
        continue;
      }
      decimal = false;
    }

    if (t === "point" || t === "dot") {
      flush();
      if (out === "" || /[+\-×÷(]$/.test(out)) out += "0";
      out += ".";
      decimal = true;
    } else if (/^[\d.]+$/.test(t)) {
      flush();
      out += t;
    } else if (t in UNITS) {
      current += UNITS[t];
      inWords = true;
    } else if (t in TENS) {
      current += TENS[t];
      inWords = true;
    } else if (t === "hundred") {
      current = (current || 1) * 100;
      inWords = true;
    } else if (t in SCALES) {
      total += (current || 1) * SCALES[t];
      current = 0;
      inWords = true;
    } else if (t === "*") {
      flush();
      out += "×";
    } else if (t === "/") {
      flush();
      out += "÷";
    } else if ("+-×÷()%".includes(t) && t.length === 1) {
      flush();
      out += t;
    } else if (t === "=") {
      flush();
      calculate = true;
    }
    // any other word ("what", "is", "the"...) is ignored
  }

  flush();
  return { expression: out, calculate };
}