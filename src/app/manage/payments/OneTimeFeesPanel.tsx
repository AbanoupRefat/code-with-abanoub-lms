"use client";

import { useState, useTransition } from "react";
import { Banknote, FileText, Printer, Trash2, Smartphone, Layers } from "lucide-react";
import { toast } from "sonner";
import { addOneTimePayment, deleteOneTimePayment } from "./actions";
import StudentPicker from "./StudentPicker";
import { confirmToast } from "./confirmToast";
import {
  COLORS,
  FEE_LABELS,
  MONTH_NAMES,
  formatEgp,
  monthYearOf,
  todayInputValue,
  type FeeType,
  type OneTimePayment,
  type QuickMethod,
} from "./types";

interface Props {
  students: { id: string; full_name: string | null; email: string | null }[];
  payments: OneTimePayment[];
  month: number;
  year: number;
  available: boolean;
}

const FEE_ICONS: Record<FeeType, typeof FileText> = { notes: FileText, printing: Printer, other: Layers };

export default function OneTimeFeesPanel({ students, payments, month, year, available }: Props) {
  const [isPending, startTransition] = useTransition();
  const [studentId, setStudentId] = useState("");
  const [feeType, setFeeType] = useState<FeeType>("notes");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState("");

  const nameOf = new Map(students.map((s) => [s.id, s.full_name || "Unknown"]));
  const displayName = (p: OneTimePayment) =>
    p.student_id ? nameOf.get(p.student_id) ?? p.student_name ?? "Unknown" : `${p.student_name ?? "Unknown"} (former)`;

  const inPeriod = payments
    .filter((p) => {
      const my = monthYearOf(p.paid_at);
      return my && my.month === month && my.year === year;
    })
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at));

  const totals: Record<FeeType, number> = { notes: 0, printing: 0, other: 0 };
  inPeriod.forEach((p) => {
    totals[p.fee_type] += Number(p.amount) || 0;
  });
  const grandTotal = totals.notes + totals.printing + totals.other;

  function save(method: QuickMethod) {
    const value = Number(amount);
    startTransition(async () => {
      const result = await addOneTimePayment({
        studentId,
        feeType,
        amount: value,
        paymentMethod: method,
        paidDate: date,
        notes: note,
      });
      if (result.success) {
        toast.success(`${FEE_LABELS[feeType]} fee saved: ${formatEgp(value)} via ${method}`);
        setAmount("");
        setNote("");
      } else {
        toast.error(result.error ?? "Could not save the payment", { duration: 8000 });
      }
    });
  }

  function remove(p: OneTimePayment) {
    confirmToast({
      id: `confirm-del-fee-${p.id}`,
      title: `Delete this ${formatEgp(p.amount)} ${FEE_LABELS[p.fee_type].toLowerCase()} fee?`,
      description: `${displayName(p)} — this removes the record permanently.`,
      onConfirm: () =>
        startTransition(async () => {
          const result = await deleteOneTimePayment(p.id);
          if (result.success) toast.success("Fee deleted");
          else toast.error(result.error ?? "Could not delete", { duration: 8000 });
        }),
    });
  }

  const canSave = !!studentId && Number(amount) > 0 && !isPending;

  return (
    <div className="space-y-6">
      {!available && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
          The one-time fees table doesn’t exist yet. Run{" "}
          <code className="font-mono text-xs">20261018_one_time_fees_and_private_sessions.sql</code> in the Supabase SQL
          Editor, then refresh.
        </div>
      )}

      {/* Period summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `Total (${MONTH_NAMES[month - 1]})`, value: grandTotal, color: "border-l-primary", icon: Banknote },
          { label: "Notes", value: totals.notes, color: "border-l-amber-500", icon: FileText },
          { label: "Printing", value: totals.printing, color: "border-l-sky-500", icon: Printer },
          { label: "Other", value: totals.other, color: "border-l-slate-400", icon: Layers },
        ].map((c) => (
          <div key={c.label} className={`clean-panel p-4 rounded-xl border-l-4 ${c.color} shadow-sm`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{c.label}</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatEgp(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="clean-panel rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-foreground">Add a one-time fee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">Student</label>
            <StudentPicker students={students} value={studentId} onChange={setStudentId} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Fee type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["notes", "printing", "other"] as const).map((t) => {
                  const Icon = FEE_ICONS[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFeeType(t)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                        feeType === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {FEE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Amount (EGP)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Unit 4 notes + binding"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => save("Cash")}
            disabled={!canSave}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Banknote className="w-4 h-4" />
            Save as Cash
          </button>
          <button
            type="button"
            onClick={() => save("InstaPay")}
            disabled={!canSave}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smartphone className="w-4 h-4" />
            Save as InstaPay
          </button>
        </div>
      </div>

      {/* Period list */}
      <div className="clean-panel rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border bg-muted/50">
          <h3 className="font-bold text-sm text-foreground">
            Fees in {MONTH_NAMES[month - 1]} {year} ({inPeriod.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Method</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Note</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {inPeriod.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No one-time fees recorded for this month.
                  </td>
                </tr>
              )}
              {inPeriod.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(p.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{displayName(p)}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${COLORS[p.fee_type]}22`, color: COLORS[p.fee_type] }}
                    >
                      {FEE_LABELS[p.fee_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                    {formatEgp(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.payment_method || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{p.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(p)}
                      disabled={isPending}
                      aria-label="Delete fee"
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
