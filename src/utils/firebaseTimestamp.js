let currentTimestampFn = () => ({ '.sv': 'timestamp' });

/**
 * Configure the function used to generate the server timestamp.
 * Allows Firebase or test suites to inject custom timestamp providers.
 */
export function setServerTimestampFn(fn) {
  currentTimestampFn = fn;
}

/**
 * Returns a Firebase Realtime Database server timestamp sentinel
 * or a customized mock timestamp.
 */
export function serverTimestamp() {
  return currentTimestampFn();
}
