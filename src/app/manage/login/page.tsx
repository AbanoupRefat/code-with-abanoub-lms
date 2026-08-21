"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // Verify this user is actually an admin before letting them in
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Access denied. This portal is for administrators only.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-foreground">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-bold text-xl text-background">
            <Shield className="w-6 h-6" />
            <span>Admin Portal</span>
          </div>
        </div>

        <div className="bg-background border border-border p-8 rounded-lg shadow-sm w-full">
          <h1 className="text-xl font-bold mb-2 text-foreground">Administrator Sign In</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            This portal is restricted to authorized administrators only.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="admin-email">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="admin@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground text-background font-medium py-2 px-4 rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Verifying..." : "Sign In to Admin"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Are you a student?{" "}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              Go to Student Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
