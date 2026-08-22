"use client";

import { useState } from "react";
import { Copy, Check, Info } from "lucide-react";
import { toast } from "sonner";

export default function ServiceAccountHelper({ email }: { email: string | undefined }) {
  const [copied, setCopied] = useState(false);

  if (!email) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Service account email copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy email.");
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mt-2">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Google Drive Integration Reminder</h4>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 mb-2">
            If you provide a Folder ID, you <strong>must</strong> share that Google Drive folder with the LMS service account as an <strong>Editor</strong>, otherwise students will get a "You need access" error.
          </p>
          <div className="flex items-center gap-2">
            <code className="bg-white dark:bg-black/40 px-2 py-1 rounded text-xs text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-800 select-all">
              {email}
            </code>
            <button 
              type="button" 
              onClick={handleCopy}
              className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-100 text-xs px-2 py-1 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
