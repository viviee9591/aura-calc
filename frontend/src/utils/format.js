export const FORMATS = ["plain", "intl", "indian"];

// the chip shows the same example number in each style
export const FORMAT_LABEL = {
  plain: "1234567",
  intl: "1,234,567",
  indian: "12,34,567",
};

function group(intPart, style) {
  if (intPart.length < 4) return intPart;
  if (style === "intl") {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  // Indian style: last 3 digits, then groups of 2
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

// Adds commas to every number inside a text like "1234+56789"
export function formatNumbers(text, style) {
  if (!text || style === "plain") return text;
  return text.replace(/\d+/g, (match, offset, whole) => {
    if (whole[offset - 1] === ".") return match; // decimals stay as they are
    return group(match, style);
  });
}