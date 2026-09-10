export function optionalHttpUrl(value, fieldName = "URL") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch { throw new Error(`${fieldName} must be a valid http or https address`); }
}

export function positiveInteger(value, fieldName, { allowEmpty = true } = {}) {
  if ((value === null || value === undefined || value === "") && allowEmpty) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new Error(`${fieldName} must be a whole number of zero or more`);
  return number;
}
