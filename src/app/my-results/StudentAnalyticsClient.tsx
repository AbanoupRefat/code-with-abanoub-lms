"use client";

import { useLang } from "@/components/LangContext";
import { BarChart2, TrendingUp, Calendar as CalendarIcon, CheckCircle2, Award, Clock, AlertCircle } from "lucide-react";

export default function StudentAnalyticsClient({ stats, submissions, overallAvg }: { stats: any, submissions: any[], overallAvg: number | null }) {
  const { t } = useLang();

  // Sort submissions chronologically for trend chart
  const chronoSorted = [...submissions].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold mb-2 text-foreground flex items-center gap-3">
          <BarChart2 className="w-8 h-8 text-primary" />
          {t("analytics.myResults")}
        </h1>
        <p className="text-muted-foreground text-sm">Review your performance history and trends.</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clean-panel p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("analytics.overallAvg")}</p>
            <TrendingUp className={`w-4 h-4 ${overallAvg && overallAvg >= 60 ? 'text-green-500' : 'text-amber-500'}`} />
          </div>
          <p className="text-3xl font-bold text-foreground">{overallAvg !== null ? `${overallAvg}%` : '-'}</p>
        </div>
        
        <div className="clean-panel p-5 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("analytics.quizzesTaken")}</p>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{submissions.length}</p>
        </div>

        <div className="clean-panel p-5 rounded-xl border border-border md:col-span-2 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{t("analytics.performanceTrend")}</p>
          {chronoSorted.length > 1 ? (
            <div className="flex items-end gap-1 h-12 w-full">
              {chronoSorted.map((sub, i) => {
                const totalPts = sub.quizzes.quiz_questions.reduce((s: number, q: any) => s + q.points, 0);
                const score = sub.final_score ?? sub.score;
                const pct = totalPts > 0 ? (score / totalPts) * 100 : 0;
                return (
                  <div key={sub.id} className="relative flex-1 flex flex-col justify-end h-full group">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${pct >= 80 ? 'bg-green-500/80 hover:bg-green-500' : pct >= 60 ? 'bg-blue-500/80 hover:bg-blue-500' : 'bg-amber-500/80 hover:bg-amber-500'}`}
                      style={{ height: `${Math.max(10, pct)}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap transition-opacity pointer-events-none z-10">
                      {Math.round(pct)}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="h-12 flex items-center justify-center text-sm text-muted-foreground italic bg-muted/30 rounded-lg border border-dashed border-border">
               Not enough data for trend
             </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      {stats.best && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="clean-panel p-5 rounded-xl border border-green-500/30 bg-green-500/5">
            <p className="text-xs font-bold text-green-600 mb-1 uppercase tracking-wider flex items-center gap-1.5"><Award className="w-4 h-4" /> {t("analytics.best")}</p>
            <p className="text-lg font-bold text-foreground truncate">{stats.best.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.best.score} pts ({stats.best.pct}%)</p>
          </div>
          {stats.worst && (
            <div className="clean-panel p-5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {t("analytics.needsWork")}</p>
              <p className="text-lg font-bold text-foreground truncate">{stats.worst.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{stats.worst.score} pts ({stats.worst.pct}%)</p>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="clean-panel rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-bold text-foreground text-lg">{t("analytics.quizHistory")}</h2>
        </div>
        
        {submissions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No quizzes taken yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Quiz Name</th>
                  <th className="px-6 py-3 font-medium">{t("analytics.date")}</th>
                  <th className="px-6 py-3 font-medium">{t("analytics.score")}</th>
                  <th className="px-6 py-3 font-medium text-right">{t("analytics.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((sub) => {
                  const totalPts = sub.quizzes.quiz_questions.reduce((s: number, q: any) => s + q.points, 0);
                  const score = sub.final_score ?? sub.score;
                  const pct = totalPts > 0 ? Math.round((score / totalPts) * 100) : 0;
                  const isGraded = sub.status === 'graded';
                  
                  return (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{sub.quizzes.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold w-12">{score} / {totalPts}</span>
                          {isGraded && (
                            <div className="w-16 h-1.5 bg-muted rounded-full">
                              <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                            <CheckCircle2 className="w-3 h-3" /> Graded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
}
