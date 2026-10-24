const sciTop = (inv) => [
  inv ? { k: "asin", label: "sin⁻¹" } : { k: "sin", label: "sin" },
  inv ? { k: "acos", label: "cos⁻¹" } : { k: "cos", label: "cos" },
  inv ? { k: "atan", label: "tan⁻¹" } : { k: "tan", label: "tan" },
  inv ? { k: "EXP", label: "eˣ" } : { k: "ln", label: "ln" },
  inv ? { k: "POW10", label: "10ˣ" } : { k: "log", label: "log" },
];

const SCI_BOTTOM = [
  { k: "π", label: "π", aria: "pi" },
  { k: "e", label: "e", aria: "e" },
  { k: "SQ", label: <>x<sup>2</sup></>, aria: "x squared" },
  { k: "^", label: <>x<sup>y</sup></>, aria: "x to the power y" },
  { k: "√", label: "√", aria: "square root" },
  { k: "!", label: "x!", aria: "factorial" },
];

const MORE = [
  { k: "INV", label: "2nd", aria: "Second function" },
  { k: "RECIP", label: "1/x", aria: "Reciprocal" },
  { k: "abs", label: "|x|", aria: "Absolute value" },
  { k: "MC", label: "MC", aria: "Memory clear" },
  { k: "MR", label: "MR", aria: "Memory recall" },
  { k: "M+", label: "M+", aria: "Add to memory" },
  { k: "M-", label: "M−", aria: "Subtract from memory" },
];

const TOP = [
  { k: "AC", label: "AC", cls: "key-ac", aria: "All clear" },
  { k: "(", label: "(", cls: "key-fn", aria: "Open bracket" },
  { k: ")", label: ")", cls: "key-fn", aria: "Close bracket" },
  { k: "%", label: "%", cls: "key-fn", aria: "Percent" },
];

const GRID = [
  { k: "7", label: "7", cls: "key-num" },
  { k: "8", label: "8", cls: "key-num" },
  { k: "9", label: "9", cls: "key-num" },
  { k: "×", label: "×", cls: "key-op", aria: "Multiply" },

  { k: "4", label: "4", cls: "key-num" },
  { k: "5", label: "5", cls: "key-num" },
  { k: "6", label: "6", cls: "key-num" },
  { k: "-", label: "−", cls: "key-op", aria: "Subtract" },

  { k: "1", label: "1", cls: "key-num" },
  { k: "2", label: "2", cls: "key-num" },
  { k: "3", label: "3", cls: "key-num" },
  { k: "+", label: "+", cls: "key-op", aria: "Add" },

  { k: "DEL", label: "DEL", cls: "key-del", aria: "Delete" },
  { k: "0", label: "0", cls: "key-num" },
  { k: ".", label: ".", cls: "key-num", aria: "Decimal point" },
  { k: "=", label: "=", cls: "key-eq", aria: "Equals" },
];

export default function Keypad({ onPress, inv, more }) {
  const btn = ({ k, label, cls, aria }) => (
    <button
      key={k}
      type="button"
      className={`key ${cls}`}
      onClick={() => onPress(k)}
      aria-label={aria || undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="pad">
      <div className="sci sci-5">
        {sciTop(inv).map(({ k, label }) => (
          <button key={k} type="button" className="sci-key" onClick={() => onPress(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="sci sci-6">
        {SCI_BOTTOM.map(({ k, label, aria }) => (
          <button
            key={k}
            type="button"
            className="sci-key"
            onClick={() => onPress(k)}
            aria-label={aria}
          >
            {label}
          </button>
        ))}
      </div>

      {more && (
        <div className="sci sci-7">
          {MORE.map(({ k, label, aria }) => (
            <button
              key={k}
              type="button"
              className={`sci-key small ${k === "INV" && inv ? "on" : ""}`}
              onClick={() => onPress(k)}
              aria-label={aria}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="keypad">
        <div className="toprow">{TOP.map(btn)}</div>
        {btn({ k: "÷", label: "÷", cls: "key-op", aria: "Divide" })}
        {GRID.map(btn)}
      </div>
    </div>
  );
}