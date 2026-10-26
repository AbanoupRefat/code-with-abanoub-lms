import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, NotebookPen } from "lucide-react";
import Navigation from "@/components/Navigation";
import { createClient } from "@/utils/supabase/server";

export const metadata = { title: "Homework — LMS" };

export default async function HomeworkListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const [hwRes, subRes] = await Promise.all([
    supabase
      .from("homeworks")
      .select("id, title, description, source, questions, due_date, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase.from("homework_submissions").select("homework_id, score, total, submitted_at").eq("student_id", user.id),
  ]);

  const homeworks = hwRes.error ? [] : hwRes.data ?? [];
  const best = new Map<string, { score: number; total: number; attempts: number }>();
  (subRes.error ? [] : subRes.data ?? []).forEach((s) => {
    const cur = best.get(s.homework_id);
    const pct = s.total ? s.score / s.total : 0;
    if (!cur) best.set(s.homework_id, { score: s.score, total: s.total, attempts: 1 });
    else {
      cur.attempts += 1;
      if (pct > (cur.total ? cur.score / cur.total : 0)) {
        cur.score = s.score;
        cur.total = s.total;
      }
    }
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={profile} />
      <main className="flex-1 min-w-0 p-4 sm:p-8 md:p-12 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Homework</h1>
          <p className="text-muted-foreground text-sm">Multiple-choice practice. You get your score and explanations right away, and you can try again.</p>
        </header>

        {homeworks.length === 0 ? (
          <div className="clean-panel rounded-xl p-10 text-center">
            <NotebookPen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-foreground font-semibold">No homework yet</p>
            <p className="text-sm text-muted-foreground mt-1">New homework will show up here.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
            {homeworks.map((h) => {
              const done = best.get(h.id);
              const count = Array.isArray(h.questions) ? h.questions.length : 0;
              const overdue = !done && h.due_date && h.due_date < today;
              return (
                <li key={h.id}>
                  <Link
                    href={`/homework/${h.id}`}
                    className="clean-panel rounded-xl p-5 flex items-center justify-between gap-4 hover:border-primary transition-colors border border-transparent"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{h.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {count} questions{h.source ? ` · ${h.source}` : ""}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {done ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Best {done.score}/{done.total} · {done.attempts} {done.attempts === 1 ? "try" : "tries"}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">Not started</span>
                        )}
                        {h.due_date && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              overdue ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {overdue ? "Was due" : "Due"} {h.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
