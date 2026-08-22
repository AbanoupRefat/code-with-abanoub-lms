"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Play, RotateCcw, Copy, Check, Terminal, Loader2, X, AlertCircle, Trash2,
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
  const jsWorkerRef = useRef<Worker | null>(null);
  const pyWorkerRef = useRef<Worker | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Pre-initialize Pyodide Web Worker in the background as soon as component mounts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker("/py-worker.js");
    pyWorkerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, status } = e.data;
      if (type === "status") {
        setPyodideStatus(status);
      }
    };

    // Kick off loading immediately in the background
    worker.postMessage({ type: "init" });
    setPyodideStatus("loading");

    return () => {
      worker.terminate();
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setLogs([]);
  };

  const runJavaScript = () => {
    return new Promise<LogEntry[]>((resolve) => {
      jsWorkerRef.current?.terminate();
      const worker = new Worker("/js-worker.js");
      jsWorkerRef.current = worker;

      const timeout = setTimeout(() => {
        worker.terminate();
        resolve([{ type: "error", message: t("playground.timeout") }]);
      }, 5000);

      worker.onmessage = (e) => {
        clearTimeout(timeout);
        const { success, logs: workerLogs, error } = e.data;
        const result: LogEntry[] = workerLogs || [];
        if (!success && error) result.push({ type: "error", message: error });
        resolve(result);
      };

      worker.onerror = (e) => {
        clearTimeout(timeout);
        resolve([{ type: "error", message: e.message }]);
      };

      worker.postMessage({ code });
    });
  };

  const runPython = (): Promise<LogEntry[]> => {
    return new Promise((resolve) => {
      if (!pyWorkerRef.current || pyodideStatus !== "ready") {
        resolve([{ type: "error", message: "Python runtime is still loading. Please wait a moment and try again." }]);
        return;
      }

      const timeout = setTimeout(() => {
        resolve([{ type: "error", message: "Python execution timed out (10s limit). Check for infinite loops." }]);
      }, 10000);

      const originalOnMessage = pyWorkerRef.current.onmessage;
      pyWorkerRef.current.onmessage = (e) => {
        // Route status messages normally
        if (e.data.type === "status") {
          setPyodideStatus(e.data.status);
          return;
        }
        if (e.data.type === "result") {
          clearTimeout(timeout);
          // Restore original message handler
          if (pyWorkerRef.current) pyWorkerRef.current.onmessage = originalOnMessage;

          const { success, logs: workerLogs, error } = e.data;
          const result: LogEntry[] = workerLogs || [];
          if (!success && error) result.push({ type: "error", message: error });
          resolve(result);
        }
      };

      pyWorkerRef.current.postMessage({ type: "run", code });
    });
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

    setTimeout(() => outputRef.current?.scrollTo({ top: 0 }), 50);
  };

  const handleClear = () => setLogs([]);
  const handleReset = () => { setCode(DEFAULT_CODE[language]); setLogs([]); };
  const handleClearCode = () => setCode("");
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
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100vh-10rem)] gap-0 rounded-2xl overflow-hidden border border-border shadow-2xl bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#3e3e42] flex-shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Traffic lights — hidden on mobile */}
          <div className="hidden sm:flex gap-1.5 me-2">
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
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-[#858585] hover:text-white"
                }`}
              >
                {lang === "javascript" ? "JS" : "Py"}
              </button>
            ))}
          </div>
          {/* Python status indicator */}
          {language === "python" && pyodideStatus !== "ready" && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              {pyodideStatus === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
              {pyodideStatus === "error" && <AlertCircle className="w-3 h-3" />}
              <span className="hidden sm:inline">{pyodideStatus === "loading" ? t("playground.loading") : "Failed"}</span>
            </div>
          )}
          {language === "python" && pyodideStatus === "ready" && (
            <span className="text-xs text-green-400/70 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="hidden sm:inline">Python Ready</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={handleCopy} title={t("playground.copyCode")} className="p-1.5 rounded text-[#858585] hover:text-white transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleClearCode} title={t("playground.clearCode")} className="p-1.5 rounded text-[#858585] hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={handleReset} title={t("playground.reset")} className="p-1.5 rounded text-[#858585] hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || (language === "python" && pyodideStatus !== "ready")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning
              ? <><Loader2 className="w-3 h-3 animate-spin" /> <span className="hidden sm:inline">{t("playground.running")}</span></>
              : <><Play className="w-3 h-3" /> <span>{t("playground.run")}</span></>
            }
          </button>
        </div>
      </div>

      {/* Split Pane — vertical on mobile, horizontal on large screens */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Code Editor */}
        <div className="flex-1 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#3e3e42] min-h-0" style={{ flexBasis: "60%" }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              lineNumbersMinChars: 3,
              renderLineHighlight: "gutter",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              bracketPairColorization: { enabled: true },
              wordWrap: "on",
            }}
          />
        </div>

        {/* Terminal Output */}
        <div className="flex flex-col bg-[#0d1117] flex-shrink-0 lg:w-80 xl:w-96" style={{ minHeight: "35%" }}>
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
