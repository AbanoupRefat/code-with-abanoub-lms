"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock, ChevronDown, ChevronUp, CreditCard, MessageCircle } from "lucide-react";
import { useLang } from "@/components/LangContext";

export interface StudentPaymentRecord {
  id: string;
  month: number;
  year: number;
  status: "paid" | "unpaid" | "pending";
  amount: number;
  payment_method: string | null;
  paid_at: string | null;
  notes: string | null;
}

interface StudentPaymentCardProps {
  payments: StudentPaymentRecord[];
  currentMonth: number;
  currentYear: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StudentPaymentCard({
  payments,
  currentMonth,
  currentYear,
}: StudentPaymentCardProps) {
  const { t } = useLang();
  const [showHistory, setShowHistory] = useState(false);

  // Find payment for current month
  const currentPayment = payments.find(
    (p) => p.month === currentMonth && p.year === currentYear
  );

  const status = currentPayment ? currentPayment.status : "unpaid";
  const monthName = MONTH_NAMES[currentMonth - 1];

  return (
    <div className="clean-panel rounded-xl overflow-hidden shadow-sm border border-border">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">{t("payments.studentCardTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {monthName} {currentYear}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {status === "paid" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("payments.paid")}
            </span>
          )}
          {status === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              {t("payments.pending")}
            </span>
          )}
          {status === "unpaid" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              {t("payments.unpaid")}
            </span>
          )}
        </div>
      </div>

      {/* Main Status Message Banner */}
      <div className="p-5 bg-muted/20">
        {status === "paid" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  Your payment for {monthName} {currentYear} has been received.
                </p>
                {currentPayment?.paid_at && (
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                    {t("payments.paidDate")}: {new Date(currentPayment.paid_at).toLocaleDateString()} ({currentPayment.payment_method || "Vodafone Cash"})
                  </p>
                )}
              </div>
            </div>
            {currentPayment?.amount ? (
              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300 px-3 py-1 bg-emerald-500/10 rounded-md">
                {currentPayment.amount} EGP
              </span>
            ) : null}
          </div>
        )}

        {status === "pending" && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                Your payment for {monthName} {currentYear} is currently under review.
              </p>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400 pl-9">
              {t("payments.whatsappNotice")}
            </p>
          </div>
        )}

        {status === "unpaid" && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-300">
                  Payment for {monthName} {currentYear} is due. Please send receipt to WhatsApp.
                </p>
                <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
                  Please complete payment for {monthName} to maintain active access.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-rose-500/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp: <strong className="font-mono text-emerald-600 font-bold">01017747943</strong></span>
              </div>
              <a
                href="https://wa.me/201017747943?text=Hello%20Teacher%20Abanoub,%20here%20is%20my%20payment%20receipt%20for%20this%20month"
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                Send Receipt
              </a>
            </div>
          </div>
        )}

        {/* Payment History Toggle */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t("payments.history")}</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Payment History Table */}
        {showHistory && (
          <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2">
            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-3">
                No past payment history recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
                {payments
                  .slice()
                  .sort((a, b) => b.year - a.year || b.month - a.month)
                  .map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30">
                      <div>
                        <span className="font-bold text-foreground">
                          {MONTH_NAMES[p.month - 1]} {p.year}
                        </span>
                        {p.paid_at && (
                          <span className="text-[10px] text-muted-foreground block">
                            Paid on {new Date(p.paid_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {p.amount > 0 && (
                          <span className="font-mono font-semibold text-foreground">{p.amount} EGP</span>
                        )}
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md text-[10px] capitalize ${
                            p.status === "paid"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : p.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
