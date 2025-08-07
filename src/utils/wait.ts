export function wait(predFn: any) {
  const poll = (done: any) => (predFn() ? done() : setTimeout(() => poll(done), 500));
  return new Promise(poll);
}
