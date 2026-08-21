"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EnrollmentChart({ data }: { data: { date: string, enrollments: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full mt-4 flex items-center justify-center bg-muted/20 rounded-lg border border-border border-dashed">
        <p className="text-muted-foreground text-sm">No enrollment data available</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))", 
              borderRadius: "8px", 
              color: "hsl(var(--foreground))",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}
          />
          <Bar dataKey="enrollments" name="Enrollments" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
