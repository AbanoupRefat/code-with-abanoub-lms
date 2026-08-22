// py-worker.js — Runs Pyodide entirely off the main thread.
// The main page sends { type: "init" } to pre-load Pyodide,
// and { type: "run", code: "..." } to execute Python code.

let pyodide = null;
let loading = false;

async function initPyodide() {
  if (pyodide || loading) return;
  loading = true;
  try {
    self.postMessage({ type: "status", status: "loading" });
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js");
    pyodide = await self.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/",
    });
    self.postMessage({ type: "status", status: "ready" });
  } catch (err) {
    loading = false;
    self.postMessage({ type: "status", status: "error", error: String(err) });
  }
}

self.onmessage = async function (e) {
  const { type, code } = e.data;

  if (type === "init") {
    await initPyodide();
    return;
  }

  if (type === "run") {
    if (!pyodide) {
      self.postMessage({ type: "result", success: false, logs: [], error: "Python runtime is not ready. Please wait and try again." });
      return;
    }

    const logs = [];

    try {
      // Redirect stdout/stderr to capture print() output
      await pyodide.runPythonAsync(`
import sys, io
_capture = io.StringIO()
sys.stdout = _capture
sys.stderr = _capture
`);
      await pyodide.runPythonAsync(code);

      const output = await pyodide.runPythonAsync(`
_out = _capture.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
_out
`);

      if (output && output.trim()) {
        output.trim().split("\n").forEach((line) => {
          logs.push({ type: "log", message: line });
        });
      }

      self.postMessage({ type: "result", success: true, logs });
    } catch (err) {
      // Restore stdout even on error
      try { await pyodide.runPythonAsync(`sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__`); } catch (_) {}
      const message = err?.message || String(err);
      self.postMessage({ type: "result", success: false, logs, error: message });
    }
  }
};
