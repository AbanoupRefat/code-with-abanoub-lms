"use client";

import { useState } from "react";
import { useLang } from "@/components/LangContext";
import { importCalendarEventsFromJson, createCalendarEvent, deleteCalendarEvent } from "@/app/manage/actions";
import { Calendar as CalendarIcon, UploadCloud, Copy, Plus, Trash2, Loader2, BookOpen, AlertCircle, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminCalendarClient({ events, courses, quizzes }: { events: any[], courses: any[], quizzes: any[] }) {
  const { t, dir } = useLang();
  const router = useRouter();

  // JSON Import State
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Manual Add State
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    description: "",
    event_type: "lecture",
    event_date: "",
    course_id: "",
    quiz_id: ""
  });

  const promptText = `Generate a curriculum calendar in JSON format. Return an array of objects.
Requirements:
- title: string (Event title)
- description: string (Optional details)
- event_type: "quiz" | "lecture" | "assignment" | "holiday" | "other"
- event_date: string (ISO 8601 format, e.g., "2026-09-01T10:00:00Z")

Example output:
[
  {
    "title": "Module 1: Intro to Python",
    "description": "Covering variables and loops.",
    "event_type": "lecture",
    "event_date": "2026-09-01T10:00:00Z"
  }
]
`;

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) return;
    setIsImporting(true);
    setImportStatus(null);
    const res = await importCalendarEventsFromJson(jsonInput);
    if (res.success) {
      setImportStatus({ type: 'success', message: 'Successfully imported events!' });
      setJsonInput("");
      router.refresh();
    } else {
      setImportStatus({ type: 'error', message: res.error || 'Import failed.' });
    }
    setIsImporting(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title || !addForm.event_date) return;
    setIsAdding(true);
    try {
      const payload = {
        ...addForm,
        event_type: addForm.event_type as any,
        meeting_url: addForm.event_type === 'live_session' ? 'room_' + Date.now() + Math.random().toString(36).substring(7) : "",
      };
      await createCalendarEvent(payload);
      setAddForm({
        title: "", description: "", event_type: "lecture", event_date: "", course_id: "", quiz_id: ""
      });
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("calendar.deleteConfirm"))) return;
    await deleteCalendarEvent(id);
    router.refresh();
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'quiz': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{t("calendar.typeQuiz")}</span>;
      case 'lecture': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{t("calendar.typeLecture")}</span>;
      case 'assignment': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">{t("calendar.typeAssignment")}</span>;
      case 'holiday': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{t("calendar.typeHoliday")}</span>;
      case 'live_session': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" /> Live Session</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{t("calendar.typeOther")}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">{t("calendar.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("calendar.adminSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Col: Event List & Manual Add */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Add Manual Event */}
          <div className="clean-panel p-6 rounded-xl border border-border">
            <h2 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> {t("calendar.addEvent")}
            </h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t("calendar.eventTitle")}
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.title}
                    onChange={e => setAddForm({...addForm, title: e.target.value})}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t("calendar.eventDate")}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={addForm.event_date}
                    onChange={e => setAddForm({...addForm, event_date: e.target.value})}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {t("calendar.eventType")}
                  </label>
                  <select
                    value={addForm.event_type}
                    onChange={e => setAddForm({...addForm, event_type: e.target.value})}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="lecture">{t("calendar.typeLecture")}</option>
                    <option value="live_session">Live Session</option>
                    <option value="quiz">{t("calendar.typeQuiz")}</option>
                    <option value="assignment">{t("calendar.typeAssignment")}</option>
                    <option value="holiday">{t("calendar.typeHoliday")}</option>
                    <option value="other">{t("calendar.typeOther")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Course / Quiz Link (Optional)
                  </label>
                  <select
                    value={addForm.event_type === 'quiz' ? addForm.quiz_id : addForm.course_id}
                    onChange={e => {
                      if (addForm.event_type === 'quiz') setAddForm({...addForm, quiz_id: e.target.value, course_id: ""});
                      else setAddForm({...addForm, course_id: e.target.value, quiz_id: ""});
                    }}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- None --</option>
                    {addForm.event_type === 'quiz' ? (
                      quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)
                    ) : (
                      courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {t("calendar.eventDesc")}
                </label>
                <textarea
                  value={addForm.description}
                  onChange={e => setAddForm({...addForm, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={isAdding}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : t("calendar.addEvent")}
              </button>
            </form>
          </div>

          {/* Existing Events */}
          <div className="clean-panel rounded-xl overflow-hidden border border-border">
            <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">{t("calendar.upcoming")}</h2>
            </div>
            
            {events.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                {t("calendar.noEvents")}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((evt) => (
                  <div key={evt.id} className="p-4 flex items-start justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-foreground">{evt.title}</h3>
                        {getEventBadge(evt.event_type)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(evt.event_date).toLocaleString()}
                      </p>
                      {evt.description && <p className="text-sm text-foreground/80">{evt.description}</p>}
                      {evt.event_type === 'live_session' && evt.meeting_url && (
                        <div className="mt-3">
                          <a
                            href={`/live/${evt.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md transition-colors"
                          >
                            Launch Room
                          </a>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Bulk JSON Import */}
        <div className="xl:col-span-1">
          <div className="clean-panel rounded-xl border border-border overflow-hidden sticky top-6">
            <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center gap-2 text-primary font-bold">
              <UploadCloud className="w-5 h-5" />
              {t("calendar.jsonImport")}
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                You can generate your curriculum schedule using an AI like ChatGPT or Claude, and paste the JSON here.
              </p>
              
              <div className="bg-muted border border-border rounded-md p-3 relative group">
                <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto">
{promptText}
                </pre>
                <button
                  onClick={copyPrompt}
                  className="absolute top-2 right-2 p-1.5 bg-background border border-border rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder="Paste JSON array here..."
                className="w-full h-48 bg-background border border-border rounded-md p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                dir="ltr"
              />

              {importStatus && (
                <div className={`p-3 rounded-md text-xs font-medium flex gap-2 ${importStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {importStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {importStatus.message}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={isImporting || !jsonInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {t("calendar.importBtn")}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
