"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setMonthlyExempt } from "./actions";
import { Calendar, CreditCard, GraduationCap, PieChart as PieIcon, Receipt, Users, Wallet } from "lucide-react";
import PaymentsClient, { type PaymentRecord, type StudentProfile } from "./PaymentsClient";
import OneTimeFeesPanel from "./OneTimeFeesPanel";
import PrivateSessionsPanel from "./PrivateSessionsPanel";
import PaymentPie, { type PieSlice } from "./PaymentPie";
import StudentPicker from "./StudentPicker";
import {
  COLORS,
  FEE_LABELS,
  MONTH_NAMES,
  PALETTE,
  formatEgp,
  monthYearOf,
  type OneTimePayment,
  type PrivateSession,
} from "./types";

type Tab = "overview" | "monthly" | "fees" | "private";
type Scope = "period" | "all";

interface Props {
  students: StudentProfile[];
  payments: PaymentRecord[];
  oneTimePayments: OneTimePayment[];
  privateSessions: PrivateSession[];
  exemptIds: string[];
  oneTimeAvailable: boolean;
  sessionsAvailable: boolean;
  currentMonth: number;
  currentYear: number;
}

function addTo(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

export default function PaymentsHub({
  students,
  payments,
  oneTimePayments,
  privateSessions,
  exemptIds,
  oneTimeAvailable,
  sessionsAvailable,
  currentMonth,
  currentYear,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [scope, setScope] = useState<Scope>("period");
  const [breakdownId, setBreakdownId] = useState("");
  const [isMoving, startMove] = useTransition();

  const exempt = new Set(exemptIds);
  const monthlyStudents = students.filter((s) => !exempt.has(s.id));
  const privateOnlyStudents = students.filter((s) => exempt.has(s.id));

  function moveToMonthly(id: string, name: string | null) {
    startMove(async () => {
      const result = await setMonthlyExempt({ studentId: id, exempt: false });
      if (result.success) toast.success(`${name || "Student"} is back in monthly tuition`);
      else toast.error(result.error ?? "Could not update", { duration: 8000 });
    });
  }

  const inScope = (m: number, y: number) => scope === "all" || (m === month && y === year);

  // ── Money received, by source ──────────────────────────────
  const methodTotals = new Map<string, number>();

  let tuition = 0;
  payments.forEach((p) => {
    if (p.status === "paid" && inScope(p.month, p.year)) {
      const amt = Number(p.amount) || 0;
      tuition += amt;
      addTo(methodTotals, p.payment_method || "Unspecified", amt);
    }
  });

  const fees = { notes: 0, printing: 0, other: 0 };
  oneTimePayments.forEach((p) => {
    const my = monthYearOf(p.paid_at);
    if (my && inScope(my.month, my.year)) {
      const amt = Number(p.amount) || 0;
      fees[p.fee_type] += amt;
      addTo(methodTotals, p.payment_method || "Unspecified", amt);
    }
  });
  const feesTotal = fees.notes + fees.printing + fees.other;

  let privateIncome = 0;
  let privateOutstanding = 0;
  privateSessions.forEach((s) => {
    if (s.status === "paid") {
      const my = monthYearOf(s.paid_at);
      if (my && inScope(my.month, my.year)) {
        const amt = Number(s.price) || 0;
        privateIncome += amt;
        addTo(methodTotals, s.payment_method || "Unspecified", amt);
      }
    } else {
      privateOutstanding += Number(s.price) || 0;
    }
  });

  const totalNet = tuition + feesTotal + privateIncome;
  const groupIncome = tuition + feesTotal;

  // ── Monthly tuition status for the selected month (students tracked monthly) ──
  const statusCounts = { paid: 0, pending: 0, unpaid: 0 };
  const monthPayments = new Map<string, PaymentRecord>();
  payments.forEach((p) => {
    if (p.month === month && p.year === year) monthPayments.set(p.student_id, p);
  });
  monthlyStudents.forEach((s) => {
    const st = monthPayments.get(s.id)?.status ?? "unpaid";
    statusCounts[st] += 1;
  });

  // ── Pie data ───────────────────────────────────────────────
  const sourcePie: PieSlice[] = [
    { name: "Monthly tuition", value: tuition, color: COLORS.tuition },
    { name: FEE_LABELS.notes, value: fees.notes, color: COLORS.notes },
    { name: FEE_LABELS.printing, value: fees.printing, color: COLORS.printing },
    { name: "Other fees", value: fees.other, color: COLORS.other },
    { name: "Private sessions", value: privateIncome, color: COLORS.private },
  ];

  let paletteIdx = 0;
  const methodPie: PieSlice[] = [...methodTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: (COLORS as Record<string, string>)[name] ?? PALETTE[paletteIdx++ % PALETTE.length],
    }));

  const statusPie: PieSlice[] = [
    { name: "Paid", value: statusCounts.paid, color: COLORS.paid },
    { name: "Pending", value: statusCounts.pending, color: COLORS.pending },
    { name: "Unpaid", value: statusCounts.unpaid, color: COLORS.unpaid },
  ];

  const groupVsPrivatePie: PieSlice[] = [
    { name: "Group (tuition + fees)", value: groupIncome, color: COLORS.tuition },
    { name: "Private sessions", value: privateIncome, color: COLORS.private },
  ];

  // ── Per-student breakdown (all time): every money stream kept separate ──
  const sb = { tuition: 0, notes: 0, printing: 0, other: 0, private: 0, owed: 0 };
  if (breakdownId) {
    payments.forEach((p) => {
      if (p.student_id === breakdownId && p.status === "paid") sb.tuition += Number(p.amount) || 0;
    });
    oneTimePayments.forEach((p) => {
      if (p.student_id === breakdownId) sb[p.fee_type] += Number(p.amount) || 0;
    });
    privateSessions.forEach((s) => {
      if (s.student_id !== breakdownId) return;
      if (s.status === "paid") sb.private += Number(s.price) || 0;
      else sb.owed += Number(s.price) || 0;
    });
  }
  const sbTotal = sb.tuition + sb.notes + sb.printing + sb.other + sb.private;
  const studentPie: PieSlice[] = [
    { name: "Group tuition", value: sb.tuition, color: COLORS.tuition },
    { name: "Private sessions", value: sb.private, color: COLORS.private },
    { name: FEE_LABELS.notes, value: sb.notes, color: COLORS.notes },
    { name: FEE_LABELS.printing, value: sb.printing, color: COLORS.printing },
    { name: "Other fees", value: sb.other, color: COLORS.other },
  ];

  const scopeLabel = scope === "all" ? "All time" : `${MONTH_NAMES[month - 1]} ${year}`;

  const tabs: { id: Tab; label: string; icon: typeof PieIcon }[] = [
    { id: "overview", label: "Overview", icon: PieIcon },
    { id: "monthly", label: "Monthly tuition", icon: CreditCard },
    { id: "fees", label: "One-time fees", icon: Receipt },
    { id: "private", label: "Private sessions", icon: GraduationCap },
  ];

  const sharedStudents = students.map((s) => ({ id: s.id, full_name: s.full_name, email: s.email }));

  return (
    <div className="space-y-6">
      {/* Header + period picker */}
      <div className="clean-panel p-5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Payments &amp; Income</h2>
            <p className="text-xs text-muted-foreground">Tuition, one-time fees and private sessions in one place.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-lg border border-border self-start md:self-auto">
          <div className="flex items-center gap-2 px-2 text-muted-foreground text-xs font-semibold">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-background border border-border text-foreground rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-background border border-border text-foreground rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{scopeLabel}</span>
            </p>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
              {(["period", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    scope === s
                      ? "bg-card text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "period" ? "This month" : "All time"}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clean-panel p-5 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Monthly tuition</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatEgp(tuition)}</p>
            </div>
            <div className="clean-panel p-5 rounded-xl border-l-4 border-l-amber-500 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">One-time fees</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatEgp(feesTotal)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Notes {formatEgp(fees.notes)} · Printing {formatEgp(fees.printing)}
              </p>
            </div>
            <div className="clean-panel p-5 rounded-xl border-l-4 border-l-violet-500 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Private sessions</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatEgp(privateIncome)}</p>
            </div>
            <div className="p-5 rounded-xl bg-primary text-primary-foreground shadow-md">
              <p className="text-xs font-semibold uppercase opacity-80">Total net revenue</p>
              <p className="text-2xl font-bold mt-1">{formatEgp(totalNet)}</p>
              <p className="text-[11px] opacity-80 mt-1">All money received · {scopeLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="clean-panel p-4 rounded-xl shadow-sm flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Tuition paid ({MONTH_NAMES[month - 1]})</p>
                <p className="font-bold text-foreground">
                  {statusCounts.paid} / {monthlyStudents.length} students
                </p>
              </div>
            </div>
            <div className="clean-panel p-4 rounded-xl shadow-sm flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-xs text-muted-foreground">Tuition unpaid ({MONTH_NAMES[month - 1]})</p>
                <p className="font-bold text-foreground">{statusCounts.unpaid} students</p>
              </div>
            </div>
            <div className="clean-panel p-4 rounded-xl shadow-sm flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-violet-500" />
              <div>
                <p className="text-xs text-muted-foreground">Private sessions outstanding</p>
                <p className="font-bold text-foreground">{formatEgp(privateOutstanding)}</p>
              </div>
            </div>
          </div>

          {/* Pie charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PaymentPie
              title="Revenue by source"
              subtitle={scopeLabel}
              data={sourcePie}
              format={formatEgp}
              centerCaption="Net"
              emptyText="No income recorded for this period"
            />
            <PaymentPie
              title="Revenue by payment method"
              subtitle={`${scopeLabel} · all sources`}
              data={methodPie}
              format={formatEgp}
              centerCaption="Net"
              emptyText="No income recorded for this period"
            />
            <PaymentPie
              title="Monthly tuition status"
              subtitle={`${MONTH_NAMES[month - 1]} ${year} · students`}
              data={statusPie}
              format={(n) => `${n}`}
              centerCaption="Students"
              emptyText="No students tracked monthly"
            />
            <PaymentPie
              title="Group classes vs private"
              subtitle={scopeLabel}
              data={groupVsPrivatePie}
              format={formatEgp}
              centerCaption="Net"
              emptyText="No income recorded for this period"
            />
          </div>

          {/* One student, every stream separate */}
          <div className="clean-panel rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-foreground">Student breakdown</h3>
              <p className="text-xs text-muted-foreground">
                All-time money from one student, split into group tuition, private sessions and fees.
              </p>
            </div>
            <div className="max-w-md">
              <StudentPicker students={sharedStudents} value={breakdownId} onChange={setBreakdownId} />
            </div>
            {breakdownId && (
              <>
                <p className="text-sm text-muted-foreground">
                  Total paid by this student: <span className="font-bold text-foreground">{formatEgp(sbTotal)}</span>
                  {sb.owed > 0 && <span className="text-rose-600"> · {formatEgp(sb.owed)} private outstanding</span>}
                </p>
                <PaymentPie
                  title="Money by stream"
                  data={studentPie}
                  format={formatEgp}
                  centerCaption="Paid"
                  emptyText="This student hasn’t paid anything yet"
                />
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            “Net” here means all money received. Expenses (ads, printing costs, etc.) aren’t tracked yet.
          </p>
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-6">
          <PaymentsClient
            initialStudents={monthlyStudents}
            initialPayments={payments}
            selectedMonth={month}
            selectedYear={year}
          />

          <div className="clean-panel rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-foreground text-sm">Private-only students ({privateOnlyStudents.length})</h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">
              These students don’t pay monthly, so they’re left out of the tuition table and stats. They pay per session
              in the Private sessions tab.
            </p>
            {privateOnlyStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None yet. Use “switch to Private only” under a student’s name above.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {privateOnlyStudents.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{s.email || "—"}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isMoving}
                      onClick={() => moveToMonthly(s.id, s.full_name)}
                      className="px-3 py-1 rounded-md text-xs font-bold bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-60"
                    >
                      Move back to monthly
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "fees" && (
        <OneTimeFeesPanel
          students={sharedStudents}
          payments={oneTimePayments}
          month={month}
          year={year}
          available={oneTimeAvailable}
        />
      )}

      {tab === "private" && (
        <PrivateSessionsPanel
          students={sharedStudents}
          sessions={privateSessions}
          exemptIds={exemptIds}
          month={month}
          year={year}
          available={sessionsAvailable}
        />
      )}
    </div>
  );
}
