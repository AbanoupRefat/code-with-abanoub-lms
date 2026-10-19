"use client";

import { Fragment, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Banknote, Smartphone, Trash2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import {
  addPrivateSessions,
  deletePrivateSession,
  markAllPrivateSessionsPaid,
  setMonthlyExempt,
  setPrivateSessionStatus,
} from "./actions";
import PaymentPie from "./PaymentPie";
import StudentPicker from "./StudentPicker";
import { confirmToast } from "./confirmToast";
import {
  COLORS,
  MONTH_NAMES,
  PALETTE,
  formatEgp,
  monthYearOf,
  todayInputValue,
  type PrivateSession,
  type QuickMethod,
} from "./types";

interface Props {
  students: { id: string; full_name: string | null; email: string | null }[];
  sessions: PrivateSession[];
  exemptIds: string[];
  month: number;
  year: number;
  available: boolean;
}

const DEFAULT_SESSIONS = 3;
const DEFAULT_PRICE = 200;

export default function PrivateSessionsPanel({ students, sessions, exemptIds, month, year, available }: Props) {
  const [isPending, startTransition] = useTransition();
  const [studentId, setStudentId] = useState("");
  const [count, setCount] = useState(String(DEFAULT_SESSIONS));
  const [price, setPrice] = useState(String(DEFAULT_PRICE));
  const [date, setDate] = useState(todayInputValue());
  const [paidNow, setPaidNow] = useState(true);
  const [privateOnly, setPrivateOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const exempt = new Set(exemptIds);
  const nameOf = new Map(students.map((s) => [s.id, s.full_name || "Unknown"]));

  // ── Calculations ───────────────────────────────────────────
  const paidSessions = sessions.filter((s) => s.status === "paid");
  const unpaidSessions = sessions.filter((s) => s.status === "unpaid");
  const earnedAll = paidSessions.reduce((sum, s) => sum + Number(s.price), 0);
  const outstanding = unpaidSessions.reduce((sum, s) => sum + Number(s.price), 0);
  const earnedPeriod = paidSessions
    .filter((s) => {
      const my = monthYearOf(s.paid_at);
      return my && my.month === month && my.year === year;
    })
    .reduce((sum, s) => sum + Number(s.price), 0);

  const byStudent = new Map<string, PrivateSession[]>();
  sessions.forEach((s) => {
    const list = byStudent.get(s.student_id) ?? [];
    list.push(s);
    byStudent.set(s.student_id, list);
  });

  const rows = [...byStudent.entries()]
    .map(([id, list]) => {
      const paid = list.filter((s) => s.status === "paid");
      const unpaid = list.filter((s) => s.status === "unpaid");
      return {
        id,
        name: nameOf.get(id) ?? "Unknown",
        list: list.slice().sort((a, b) => b.session_date.localeCompare(a.session_date)),
        total: list.length,
        paidCount: paid.length,
        unpaidCount: unpaid.length,
        earned: paid.reduce((sum, s) => sum + Number(s.price), 0),
        owed: unpaid.reduce((sum, s) => sum + Number(s.price), 0),
      };
    })
    .sort((a, b) => b.owed - a.owed || a.name.localeCompare(b.name));

  const earnedPie = (() => {
    const sorted = rows.filter((r) => r.earned > 0).sort((a, b) => b.earned - a.earned);
    const top = sorted.slice(0, 6).map((r, i) => ({ name: r.name, value: r.earned, color: PALETTE[i % PALETTE.length] }));
    const rest = sorted.slice(6).reduce((sum, r) => sum + r.earned, 0);
    if (rest > 0) top.push({ name: "Others", value: rest, color: COLORS.Unspecified });
    return top;
  })();

  // ── Actions ────────────────────────────────────────────────
  const countNum = Number(count);
  const priceNum = Number(price);
  const previewTotal = Number.isFinite(countNum) && Number.isFinite(priceNum) ? countNum * priceNum : 0;
  const canAdd = !!studentId && Number.isInteger(countNum) && countNum >= 1 && priceNum >= 0 && price !== "" && !isPending;

  function addSessions(paid: boolean, method?: QuickMethod) {
    startTransition(async () => {
      const result = await addPrivateSessions({
        studentId,
        count: countNum,
        pricePerSession: priceNum,
        paid,
        paymentMethod: method ?? null,
        date,
        privateOnly,
      });
      if (result.success) {
        toast.success(
          `${countNum} session${countNum === 1 ? "" : "s"} × ${formatEgp(priceNum)} added for ${
            nameOf.get(studentId) ?? "student"
          }${paid ? ` (paid via ${method})` : " (unpaid)"}`
        );
        setExpanded((prev) => new Set(prev).add(studentId));
      } else {
        toast.error(result.error ?? "Could not add sessions", { duration: 8000 });
      }
    });
  }

  function run(action: () => Promise<{ success: boolean; error?: string }>, okMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.success) toast.success(okMessage);
      else toast.error(result.error ?? "Something went wrong", { duration: 8000 });
    });
  }

  function removeSession(s: PrivateSession) {
    confirmToast({
      id: `confirm-del-session-${s.id}`,
      title: `Delete this ${formatEgp(s.price)} session?`,
      description: `${nameOf.get(s.student_id) ?? "Student"} — ${s.session_date}. This removes the record permanently.`,
      onConfirm: () => run(() => deletePrivateSession(s.id), "Session deleted"),
    });
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {!available && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
          The private sessions table doesn’t exist yet. Run{" "}
          <code className="font-mono text-xs">20261018_one_time_fees_and_private_sessions.sql</code> in the Supabase SQL
          Editor, then refresh.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clean-panel p-4 rounded-xl border-l-4 border-l-violet-500 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Earned ({MONTH_NAMES[month - 1]})</p>
          <p className="text-xl font-bold text-foreground mt-1">{formatEgp(earnedPeriod)}</p>
        </div>
        <div className="clean-panel p-4 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Earned (all time)</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatEgp(earnedAll)}</p>
        </div>
        <div className="clean-panel p-4 rounded-xl border-l-4 border-l-rose-500 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Outstanding</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{formatEgp(outstanding)}</p>
        </div>
        <div className="clean-panel p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Sessions</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {paidSessions.length} paid
            <span className="text-sm font-medium text-muted-foreground"> / {sessions.length}</span>
          </p>
        </div>
      </div>

      {/* Add sessions */}
      <div className="clean-panel rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground">Add private sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Student</label>
            <StudentPicker students={students} value={studentId} onChange={setStudentId} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Sessions</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Price each</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {Number.isFinite(countNum) ? countNum : 0} × {formatEgp(Number.isFinite(priceNum) ? priceNum : 0)} ={" "}
              <span className="font-bold text-foreground">{formatEgp(previewTotal)}</span>
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={paidNow}
                  onChange={(e) => setPaidNow(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                Paid now
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={privateOnly}
                  onChange={(e) => setPrivateOnly(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                Private only <span className="text-xs text-muted-foreground">(don’t track this student in monthly tuition)</span>
              </label>
            </div>
          </div>
        </div>

        {paidNow ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => addSessions(true, "Cash")}
              disabled={!canAdd}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Banknote className="w-4 h-4" />
              Add &amp; paid · Cash
            </button>
            <button
              type="button"
              onClick={() => addSessions(true, "InstaPay")}
              disabled={!canAdd}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Smartphone className="w-4 h-4" />
              Add &amp; paid · InstaPay
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addSessions(false)}
            disabled={!canAdd}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add as unpaid ({formatEgp(previewTotal)} outstanding)
          </button>
        )}
      </div>

      {/* Private charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PaymentPie
          title="Private income by student"
          subtitle="Paid sessions, all time"
          data={earnedPie}
          format={formatEgp}
          centerCaption="Earned"
          emptyText="No paid private sessions yet"
        />
        <PaymentPie
          title="Paid vs outstanding"
          subtitle="All private sessions, all time"
          data={[
            { name: "Paid", value: earnedAll, color: COLORS.paid },
            { name: "Outstanding", value: outstanding, color: COLORS.unpaid },
          ]}
          format={formatEgp}
          centerCaption="Booked"
          emptyText="No private sessions yet"
        />
      </div>

      {/* Students table */}
      <div className="clean-panel rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border bg-muted/50">
          <h3 className="font-bold text-sm text-foreground">Private students ({rows.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Sessions</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Earned</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Outstanding</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No private sessions yet — add a bulk above.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const isOpen = expanded.has(r.id);
                const isPrivateOnly = exempt.has(r.id);
                return (
                  <Fragment key={r.id}>
                    <tr className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(r.id)}
                          aria-label={isOpen ? "Hide sessions" : "Show sessions"}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{r.name}</p>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            run(
                              () => setMonthlyExempt({ studentId: r.id, exempt: !isPrivateOnly }),
                              isPrivateOnly ? "Now tracked in monthly tuition too" : "Now private only (hidden from monthly tuition)"
                            )
                          }
                          title="Click to switch"
                          className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors disabled:opacity-60 ${
                            isPrivateOnly
                              ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          }`}
                        >
                          {isPrivateOnly ? <UserCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {isPrivateOnly ? "Private only" : "Group + Private"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="font-semibold text-foreground">{r.total}</span> total ·{" "}
                        <span className="text-emerald-600 font-semibold">{r.paidCount}</span> paid ·{" "}
                        <span className="text-rose-600 font-semibold">{r.unpaidCount}</span> unpaid
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-600 whitespace-nowrap">
                        {formatEgp(r.earned)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-rose-600 whitespace-nowrap">
                        {r.owed > 0 ? formatEgp(r.owed) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {r.unpaidCount > 0 && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  run(
                                    () => markAllPrivateSessionsPaid({ studentId: r.id, paymentMethod: "Cash" }),
                                    `All ${r.unpaidCount} sessions paid · Cash`
                                  )
                                }
                                className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 whitespace-nowrap"
                              >
                                Pay all · Cash
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  run(
                                    () => markAllPrivateSessionsPaid({ studentId: r.id, paymentMethod: "InstaPay" }),
                                    `All ${r.unpaidCount} sessions paid · InstaPay`
                                  )
                                }
                                className="px-3 py-1 rounded-md text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 whitespace-nowrap"
                              >
                                Pay all · InstaPay
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-muted/20">
                        <td />
                        <td colSpan={5} className="px-4 py-3">
                          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                            {r.list.map((s) => (
                              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-muted-foreground whitespace-nowrap">{s.session_date}</span>
                                  <span className="font-mono font-semibold text-foreground">{formatEgp(s.price)}</span>
                                  <span
                                    className={`font-bold px-2 py-0.5 rounded-full ${
                                      s.status === "paid"
                                        ? "bg-emerald-500/10 text-emerald-600"
                                        : "bg-rose-500/10 text-rose-600"
                                    }`}
                                  >
                                    {s.status === "paid" ? `Paid${s.payment_method ? ` · ${s.payment_method}` : ""}` : "Unpaid"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {s.status === "paid" ? (
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => run(() => setPrivateSessionStatus({ id: s.id, status: "unpaid" }), "Marked unpaid")}
                                      className="px-2.5 py-1 rounded-md text-xs font-bold bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-60"
                                    >
                                      Mark unpaid
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() =>
                                          run(
                                            () => setPrivateSessionStatus({ id: s.id, status: "paid", paymentMethod: "Cash" }),
                                            "Paid · Cash"
                                          )
                                        }
                                        className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                      >
                                        Cash
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() =>
                                          run(
                                            () => setPrivateSessionStatus({ id: s.id, status: "paid", paymentMethod: "InstaPay" }),
                                            "Paid · InstaPay"
                                          )
                                        }
                                        className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
                                      >
                                        InstaPay
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => removeSession(s)}
                                    aria-label="Delete session"
                                    className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md disabled:opacity-60"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
