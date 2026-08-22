"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Play, RotateCcw, Copy, Check, Terminal, Loader2, X, AlertCircle,
} from "lucide-react";
import { useLang } from "@/components/LangContext";

type Language = "javascript" | "python";
type LogEntry = { type: "log" | "error" | "warn" | "result" | "system"; message: string };

const DEFAULT_CODE: Record<Language, string> = {
  javascript: `// Welcome to the JavaScript Playground!
// Write your code and click "Run Code"

const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("Abanoub"));

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);
`,
  python: `# Welcome to the Python Playground!
# Write your code and click "Run Code"

def greet(name):
    return f"Hello, {name}!"

print(greet("Abanoub"))

numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled:", doubled)

total = sum(numbers)
print("Sum:", total)
`,
};

export default function PlaygroundClient() {
  const { t, dir } = useLang();
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideStatus, setPyodideStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const pyodideRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Load Pyodide lazily when Python is selected
  useEffect(() => {
    if (language !== "python" || pyodideRef.current || pyodideStatus !== "idle") return;
    setPyodideStatus("loading");

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js";
    script.onload = async () => {
      try {
        // @ts-ignore
        const pyodide = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/",
        });
        pyodideRef.current = pyodide;
        setPyodideStatus("ready");
      } catch {
        setPyodideStatus("error");
      }
    };
    script.onerror = () => setPyodideStatus("error");
    document.head.appendChild(script);
  }, [language, pyodideStatus]);

  // Switch language - update editor content to default
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setLogs([]);
  };

  const runJavaScript = () => {
    return new Promise<LogEntry[]>((resolve) => {
      // Terminate any previous worker
      workerRef.current?.terminate();
      const worker = new Worker("/js-worker.js");
      workerRef.current = worker;

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve([{ type: "error", message: t("playground.timeout") }]);
      }, 5000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        const { success, logs: workerLogs, error } = e.data;
        const result: LogEntry[] = workerLogs || [];
        if (!success && error) {
          result.push({ type: "error", message: error });
        }
        resolve(result);
      };

      worker.onerror = (e) => {
        clearTimeout(timeout);
        resolve([{ type: "error", message: e.message }]);
      };

      worker.postMessage({ code });
    });
  };

  const runPython = async (): Promise<LogEntry[]> => {
    if (!pyodideRef.current) {
      return [{ type: "error", message: "Python runtime not ready yet." }];
    }

    const pyodide = pyodideRef.current;
    const result: LogEntry[] = [];

    try {
      // Redirect stdout to capture print() output
      await pyodide.runPythonAsync(`
import sys, io
_stdout_capture = io.StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stdout_capture
`);
      await pyodide.runPythonAsync(code);
      const output: string = await pyodide.runPythonAsync(`
_out = _stdout_capture.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
_out
`);
      if (output) {
        output.trim().split("\n").forEach((line) => {
          result.push({ type: "log", message: line });
        });
      }
    } catch (err: any) {
      // Restore stdout even on error
      try { await pyodide.runPythonAsync(`sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__`); } catch {}
      result.push({ type: "error", message: err.message || String(err) });
    }

    return result;
  };

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([{ type: "system", message: `▶ Running ${language === "python" ? "Python" : "JavaScript"}...` }]);

    const start = Date.now();
    const result = language === "javascript" ? await runJavaScript() : await runPython();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    setLogs([
      { type: "system", message: `▶ Executed in ${elapsed}s` },
      ...result,
    ]);
    setIsRunning(false);

    // Scroll output to top
    setTimeout(() => outputRef.current?.scrollTo({ top: 0 }), 50);
  };

  const handleClear = () => setLogs([]);
  const handleReset = () => { setCode(DEFAULT_CODE[language]); setLogs([]); };
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error": return "text-red-400";
      case "warn": return "text-amber-400";
      case "result": return "text-blue-400";
      case "system": return "text-muted-foreground italic text-xs";
      default: return "text-green-400";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-0 rounded-2xl overflow-hidden border border-border shadow-2xl bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-[#3e3e42] flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-1.5 me-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-md p-0.5">
            {(["javascript", "python"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-[#858585] hover:text-white"
                }`}
              >
                {lang === "javascript" ? "JavaScript" : "Python"}
              </button>
            ))}
          </div>
          {/* Python loading indicator */}
          {language === "python" && pyodideStatus !== "ready" && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              {pyodideStatus === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
              {pyodideStatus === "error" && <AlertCircle className="w-3 h-3" />}
              <span>{pyodideStatus === "loading" ? t("playground.loading") : "Failed to load Python"}</span>
            </div>
          )}
          {language === "python" && pyodideStatus === "ready" && (
            <span className="text-xs text-green-400/70 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Python Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy} title={t("playground.copyCode")} className="p-1.5 rounded text-[#858585] hover:text-white transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleReset} title={t("playground.reset")} className="p-1.5 rounded text-[#858585] hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || (language === "python" && pyodideStatus !== "ready")}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("playground.running")}</>
              : <><Play className="w-3.5 h-3.5" /> {t("playground.run")}</>
            }
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Code Editor */}
        <div className="flex-1 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#3e3e42]">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
              renderLineHighlight: "gutter",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        {/* Terminal Output */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-[#0d1117] flex-shrink-0">
          {/* Terminal header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex-shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#8b949e]">
              <Terminal className="w-4 h-4" />
              <span>{t("playground.output")}</span>
            </div>
            {logs.length > 0 && (
              <button onClick={handleClear} className="text-xs text-[#8b949e] hover:text-white transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> {t("playground.clear")}
              </button>
            )}
          </div>

          {/* Output lines */}
          <div ref={outputRef} className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1">
            {logs.length === 0 ? (
              <p className="text-[#484f58] text-xs">{t("playground.noOutput")}</p>
            ) : (
              logs.map((entry, i) => (
                <div key={i} className={`leading-relaxed whitespace-pre-wrap break-all ${logColor(entry.type)}`} dir="ltr">
                  {entry.type === "error" && <span className="text-red-500 me-1">✕</span>}
                  {entry.type === "warn" && <span className="text-amber-400 me-1">⚠</span>}
                  {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
