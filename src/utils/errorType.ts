export function errorType(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified = "Can't stringify the value";
  try {
    stringified = JSON.stringify(value);
  } catch {}

  const error = new Error(`${stringified}`);
  return error;
}
