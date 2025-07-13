export function errorType(value: unknown): Error | unknown {
  if (value instanceof Error) return value;

  let stringified = "";
  try {
    stringified = JSON.stringify(value);
    return new Error(stringified);
  } catch {
    return value;
  }
}
