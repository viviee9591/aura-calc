import { formatNumbers } from "../utils/format.js";

// "(25+15)×2" -> "(25 + 15) × 2"  (display only)
const spaceOps = (s) => s.replace(/([\d)%!πe])\s*([+\-×÷])\s*/g, "$1 $2 ");
const tidy = (s) => s.replace(/-/g, "−");

export default function Display({ prev, value, error, numStyle, onCopy }) {
  const shown = error ? error : formatNumbers(value || "0", numStyle);
  const text = tidy(shown);
  const prevText = tidy(
    spaceOps(formatNumbers(prev.replace(/\s*=$/, ""), numStyle))
  );

  let size = "lg";
  if (text.length > 14) size = "xs";
  else if (text.length > 10) size = "sm";
  else if (text.length > 7) size = "md";

  const canCopy = !error && value;

  return (
    <div className="display" aria-live="polite">
      <div className="display-prev">{prevText}</div>
      <div
        className={`display-value ${error ? "error" : size} ${canCopy ? "copyable" : ""}`}
        onClick={() => canCopy && onCopy()}
        title={canCopy ? "Tap to copy" : undefined}
      >
        {text}
      </div>
    </div>
  );
}