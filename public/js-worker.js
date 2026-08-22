// Sandboxed JavaScript Web Worker
// This file runs in an isolated thread. If it hangs, the main thread
// can terminate it after 5 seconds without crashing the browser.

const logs = [];

// Override console methods to capture output
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

const captureLog = (type) => (...args) => {
  const message = args
    .map((a) => {
      if (a === null) return "null";
      if (a === undefined) return "undefined";
      if (typeof a === "object") {
        try { return JSON.stringify(a, null, 2); } catch { return String(a); }
      }
      return String(a);
    })
    .join(" ");
  logs.push({ type, message });
};

self.console = {
  log: captureLog("log"),
  error: captureLog("error"),
  warn: captureLog("warn"),
  info: captureLog("log"),
};

self.onmessage = function (e) {
  const { code } = e.data;
  logs.length = 0;

  try {
    // Use Function constructor for safer scoping than eval
    const fn = new Function(code);
    const result = fn();

    // If the code returned a value, capture it too
    if (result !== undefined) {
      logs.push({ type: "result", message: String(result) });
    }

    self.postMessage({ success: true, logs });
  } catch (err) {
    self.postMessage({
      success: false,
      logs,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
