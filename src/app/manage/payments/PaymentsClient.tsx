"use client";

import { useState, useTransition } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  CreditCard, 
  User, 
  Edit3, 
  DollarSign, 
  Calendar, 
  ArrowUpDown,
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";
import { updateStudentPaymentStatus, batchUpdateStudentPayments } from "./actions";
import { useLang } from "@/components/LangContext";

export interface StudentProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  student_id: string;
  month: number;
  year: number;
  status: "paid" | "unpaid" | "pending";
  amount: number;
  payment_method: string | null;
  paid_at: string | null;
  notes: string | null;
}

interface PaymentsClientProps {
  initialStudents: StudentProfile[];
  initialPayments: PaymentRecord[];
  currentMonth: number;
  currentYear: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PAYMENT_METHODS = [
  "Vodafone Cash",
  "InstaPay",
  "Cash",
  "Bank Transfer",
  "Other"
];

export default function PaymentsClient({
  initialStudents,
  initialPayments,
  currentMonth,
  currentYear,
}: PaymentsClientProps) {
  const { t } = useLang();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "pending">("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<{
    student: StudentProfile;
    payment?: PaymentRecord;
  } | null>(null);

  const [editStatus, setEditStatus] = useState<"paid" | "unpaid" | "pending">("paid");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<string>("Vodafone Cash");
  const [editNotes, setEditNotes] = useState<string>("");

  // Map payments by student ID
  const paymentMap = new Map<string, PaymentRecord>();
  initialPayments.forEach((p) => {
    if (p.month === selectedMonth && p.year === selectedYear) {
      paymentMap.set(p.student_id, p);
    }
  });

  // Calculate metrics
  const totalStudents = initialStudents.length;
  let paidCount = 0;
  let unpaidCount = 0;
  let pendingCount = 0;
  let totalRevenue = 0;

  initialStudents.forEach((st) => {
    const payment = paymentMap.get(st.id);
    const status = payment ? payment.status : "unpaid";
    if (status === "paid") {
      paidCount++;
      totalRevenue += Number(payment?.amount || 0);
    } else if (status === "pending") {
      pendingCount++;
    } else {
      unpaidCount++;
    }
  });

  // Filter students
  const filteredStudents = initialStudents.filter((student) => {
    const payment = paymentMap.get(student.id);
    const status = payment ? payment.status : "unpaid";

    if (statusFilter !== "all" && status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = student.full_name?.toLowerCase().includes(q);
      const emailMatch = student.email?.toLowerCase().includes(q);
      return nameMatch || emailMatch;
    }

    return true;
  });

  // Toggle quick status
  const handleQuickToggle = (studentId: string, currentStatus: "paid" | "unpaid" | "pending") => {
    const nextStatus = currentStatus === "paid" ? "unpaid" : "paid";

    startTransition(async () => {
      try {
        await updateStudentPaymentStatus({
          studentId,
          month: selectedMonth,
          year: selectedYear,
          status: nextStatus,
          paymentMethod: "Vodafone Cash",
        });
        toast.success(
          nextStatus === "paid"
            ? t("payments.markPaid")
            : t("payments.markUnpaid")
        );
      } catch (err: any) {
        toast.error(err?.message || "Failed to update payment status");
      }
    });
  };

  // Open edit modal
  const handleOpenEdit = (student: StudentProfile) => {
    const payment = paymentMap.get(student.id);
    setEditingStudent({ student, payment });
    setEditStatus(payment ? payment.status : "paid");
    setEditAmount(payment ? payment.amount : 0);
    setEditMethod(payment?.payment_method || "Vodafone Cash");
    setEditNotes(payment?.notes || "");
  };

  // Save edit modal
  const handleSaveModal = () => {
    if (!editingStudent) return;

    startTransition(async () => {
      try {
        await updateStudentPaymentStatus({
          studentId: editingStudent.student.id,
          month: selectedMonth,
          year: selectedYear,
          status: editStatus,
          amount: editAmount,
          paymentMethod: editMethod,
          notes: editNotes,
        });
        toast.success(t("payments.updateStatus") + " successful!");
        setEditingStudent(null);
      } catch (err: any) {
        toast.error(err?.message || "Error updating payment");
      }
    });
  };

  // Select all checkboxes
  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  // Batch action
  const handleBatchStatus = (targetStatus: "paid" | "unpaid" | "pending") => {
    if (selectedStudentIds.length === 0) return;

    startTransition(async () => {
      try {
        await batchUpdateStudentPayments({
          studentIds: selectedStudentIds,
          month: selectedMonth,
          year: selectedYear,
          status: targetStatus,
        });
        toast.success(`Updated ${selectedStudentIds.length} students to ${targetStatus}`);
        setSelectedStudentIds([]);
      } catch (err: any) {
        toast.error(err?.message || "Failed batch update");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Filter Bar */}
      <div className="clean-panel p-6 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("payments.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("payments.subtitle")}</p>
          </div>
        </div>

        {/* Month & Year Selection */}
        <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-lg border border-border">
          <div className="flex items-center gap-2 px-2 text-muted-foreground text-xs font-semibold">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{t("payments.month")}:</span>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-background border border-border text-foreground rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="clean-panel p-5 rounded-xl border-l-4 border-l-blue-500 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("payments.totalStudents")}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalStudents}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="clean-panel p-5 rounded-xl border-l-4 border-l-emerald-500 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("payments.paidCount")}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
              <span className="text-xs text-muted-foreground font-medium">
                ({totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="clean-panel p-5 rounded-xl border-l-4 border-l-rose-500 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("payments.unpaidCount")}</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{unpaidCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="clean-panel p-5 rounded-xl border-l-4 border-l-amber-500 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Revenue ({MONTH_NAMES[selectedMonth - 1]})</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalRevenue.toLocaleString()} EGP</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <div className="clean-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("payments.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border w-full md:w-auto overflow-x-auto">
          {(["all", "paid", "unpaid", "pending"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "all" ? t("grading.all") : t(`payments.${st}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg flex items-center justify-between animate-in fade-in">
          <span className="text-xs font-bold text-primary">
            {selectedStudentIds.length} student(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchStatus("paid")}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("payments.markPaid")}
            </button>
            <button
              onClick={() => handleBatchStatus("unpaid")}
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t("payments.markUnpaid")}
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="clean-panel rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-muted/80 border-b border-border">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedStudentIds.length > 0 &&
                    selectedStudentIds.length === filteredStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3.5 font-semibold text-muted-foreground">{t("students.name")}</th>
                <th className="px-6 py-3.5 font-semibold text-muted-foreground">{t("payments.status")}</th>
                <th className="px-6 py-3.5 font-semibold text-muted-foreground">{t("payments.amount")}</th>
                <th className="px-6 py-3.5 font-semibold text-muted-foreground">{t("payments.method")}</th>
                <th className="px-6 py-3.5 font-semibold text-muted-foreground">{t("payments.paidDate")}</th>
                <th className="px-6 py-3.5 font-semibold text-muted-foreground text-right">{t("students.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    No student payment records found for this period.
                  </td>
                </tr>
              )}

              {filteredStudents.map((student) => {
                const payment = paymentMap.get(student.id);
                const status = payment ? payment.status : "unpaid";
                const isSelected = selectedStudentIds.includes(student.id);

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id));
                          } else {
                            setSelectedStudentIds([...selectedStudentIds, student.id]);
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden border border-border flex-shrink-0">
                          {student.avatar_url ? (
                            <img
                              src={student.avatar_url}
                              alt={student.full_name || "User"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {student.full_name || "Unknown Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.email || "—"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {status === "paid" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t("payments.paid")}
                        </span>
                      )}
                      {status === "unpaid" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          {t("payments.unpaid")}
                        </span>
                      )}
                      {status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          {t("payments.pending")}
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-mono font-semibold text-foreground">
                      {payment && payment.amount > 0 ? `${payment.amount} EGP` : "—"}
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {payment?.payment_method || "—"}
                    </td>

                    {/* Paid Date */}
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {payment?.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    {/* Quick Action & Edit */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Toggle Button */}
                        <button
                          onClick={() => handleQuickToggle(student.id, status)}
                          disabled={isPending}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            status === "paid"
                              ? "bg-muted text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {status === "paid" ? t("payments.markUnpaid") : t("payments.markPaid")}
                        </button>

                        {/* Detail Edit Modal Trigger */}
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                          title="Edit Payment Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Payment Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-bold text-lg text-foreground">
                Edit Payment ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Student Name */}
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">{t("students.name")}</p>
                <p className="font-semibold text-foreground text-base mt-0.5">
                  {editingStudent.student.full_name || "Unknown Student"}
                </p>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  {t("payments.status")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["paid", "pending", "unpaid"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                        editStatus === st
                          ? st === "paid"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : st === "pending"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-rose-600 text-white border-rose-600"
                          : "bg-background text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {t(`payments.${st}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {t("payments.amount")} (EGP)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {t("payments.method")}
                </label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {t("payments.notes")}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional admin notes..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isPending}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
