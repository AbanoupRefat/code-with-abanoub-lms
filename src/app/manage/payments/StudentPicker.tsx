"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface PickerStudent {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface StudentPickerProps {
  students: PickerStudent[];
  value: string;
  onChange: (id: string) => void;
}

export default function StudentPicker({ students, value, onChange }: StudentPickerProps) {
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.id === value ||
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [students, query, value]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search student…"
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Choose a student…</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name || "Unknown"} {s.email ? `— ${s.email}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
