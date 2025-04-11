export function errorType(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified = "Can't stringify the value";
  try {
    stringified = JSON.stringify(value);
  } catch {}

  return new Error(stringified);
}
