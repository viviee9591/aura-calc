export const OPS = ["+", "-", "×", "÷"];

const FUNCS = ["asin", "acos", "atan", "sin", "cos", "tan", "log", "ln", "abs"];

const fail = (msg = "Invalid expression") => {
  throw new Error(msg);
};

// ---------- 1. Split the text into tokens ----------
function tokenize(src) {
  const text = src.replace(/\*/g, "×").replace(/\//g, "÷");
  const tokens = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === " ") {
      i++;
      continue;
    }

    // numbers (also results like 7.2e+306)
    if (/[\d.]/.test(ch)) {
      let num = "";
      while (i < text.length && /[\d.]/.test(text[i])) num += text[i++];
      if (num === "." || (num.match(/\./g) || []).length > 1) fail();
      if (
        text[i] === "e" &&
        /[+-]/.test(text[i + 1] || "") &&
        /\d/.test(text[i + 2] || "")
      ) {
        num += text[i++];
        num += text[i++];
        while (i < text.length && /\d/.test(text[i])) num += text[i++];
      }
      tokens.push({ t: "num", v: parseFloat(num) });
      continue;
    }

    // words: e, sin, cos, ...
    if (/[a-z]/.test(ch)) {
      let w = "";
      while (i < text.length && /[a-z]/.test(text[i])) w += text[i++];
      if (w === "e") tokens.push({ t: "const", v: Math.E });
      else if (w === "pi") tokens.push({ t: "const", v: Math.PI });
      else if (FUNCS.includes(w)) tokens.push({ t: "func", f: w });
      else fail();
      continue;
    }

    if (ch === "π") {
      tokens.push({ t: "const", v: Math.PI });
      i++;
      continue;
    }

    if (ch === "√") {
      tokens.push({ t: "func", f: "sqrt" });
      i++;
      continue;
    }

    if ("+-×÷()%^!".includes(ch)) {
      tokens.push({ t: ch });
      i++;
      continue;
    }

    fail();
  }
  return tokens;
}

// ---------- helpers ----------
const snap = (v) => (Math.abs(v) < 1e-12 ? 0 : v); // sin(180°) -> 0, not 1.2e-16

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) fail("Factorial needs a whole number");
  if (n > 170) fail("Number too big");
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

function applyFunc(name, x, angle) {
  const toRad = (v) => (angle === "deg" ? (v * Math.PI) / 180 : v);
  const fromRad = (v) => (angle === "deg" ? (v * 180) / Math.PI : v);

  switch (name) {
    case "sin":
      return snap(Math.sin(toRad(x)));
    case "cos":
      return snap(Math.cos(toRad(x)));
    case "tan": {
      const r = toRad(x);
      if (Math.abs(Math.cos(r)) < 1e-12) fail("Undefined");
      return snap(Math.tan(r));
    }
    case "asin":
      if (Math.abs(x) > 1) fail("Invalid input");
      return fromRad(Math.asin(x));
    case "acos":
      if (Math.abs(x) > 1) fail("Invalid input");
      return fromRad(Math.acos(x));
    case "atan":
      return fromRad(Math.atan(x));
    case "ln":
      if (x <= 0) fail("Invalid input");
      return Math.log(x);
    case "log":
      if (x <= 0) fail("Invalid input");
      return Math.log10(x);
    case "sqrt":
      if (x < 0) fail("Invalid input");
      return Math.sqrt(x);
    case "abs":
      return Math.abs(x);
    default:
      return fail();
  }
}

// ---------- 2. Read the tokens with the right maths order ----------
function parse(tokens, angle) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  // + and -  (weakest)
  function expr() {
    let value = term();
    while (peek() && (peek().t === "+" || peek().t === "-")) {
      const op = next().t;
      const right = term();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  // × ÷ and implicit multiplication: 2π, 3sin(30), 2(3)
  function term() {
    let value = unary();
    while (
      peek() &&
      ["×", "÷", "(", "num", "func", "const"].includes(peek().t)
    ) {
      let op = "×";
      if (peek().t === "×" || peek().t === "÷") op = next().t;
      const right = unary();
      if (op === "÷") {
        if (right === 0) fail("Can't divide by zero");
        value = value / right;
      } else {
        value = value * right;
      }
    }
    return value;
  }

  // -5 or +5   (so -2^2 = -4)
  function unary() {
    const tk = peek();
    if (tk && (tk.t === "-" || tk.t === "+")) {
      next();
      const v = unary();
      return tk.t === "-" ? -v : v;
    }
    return power();
  }

  // 2^3  (right to left: 2^3^2 = 2^9)
  function power() {
    const base = postfix();
    if (peek() && peek().t === "^") {
      next();
      return Math.pow(base, unary());
    }
    return base;
  }

  // 50%  and  5!
  function postfix() {
    let value = primary();
    while (peek() && (peek().t === "%" || peek().t === "!")) {
      const op = next().t;
      value = op === "%" ? value / 100 : factorial(value);
    }
    return value;
  }

  // a number, a constant, a function, or ( ... )
  function primary() {
    const tk = next();
    if (!tk) fail();
    if (tk.t === "num" || tk.t === "const") return tk.v;
    if (tk.t === "func") return applyFunc(tk.f, primary(), angle);
    if (tk.t === "(") {
      const value = expr();
      if (!peek() || peek().t !== ")") fail();
      next();
      return value;
    }
    return fail();
  }

  const result = expr();
  if (pos < tokens.length) fail();
  return result;
}

// ---------- 3. Make the answer neat ----------
function format(n) {
  if (!Number.isFinite(n)) fail();
  const rounded = parseFloat(n.toPrecision(12)); // 0.1+0.2 -> 0.3
  const abs = Math.abs(rounded);
  if (abs >= 1e15 || (abs !== 0 && abs < 1e-9)) {
    return rounded.toExponential(6).replace(/\.?0+e/, "e");
  }
  return String(rounded);
}

// Remove trailing operators / empty functions and close open brackets
export function cleanExpression(expression) {
  let s = expression.replace(
    /(?:(?:asin|acos|atan|sin|cos|tan|log|ln|abs|√)\(|[+\-×÷^(])+$/,
    ""
  );
  const open = s.split("(").length - s.split(")").length;
  if (open > 0) s += ")".repeat(open);
  return s;
}

export function evaluate(expression, angle = "deg") {
  return format(parse(tokenize(expression), angle));
}