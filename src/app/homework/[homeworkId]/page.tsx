import { notFound, redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { createClient } from "@/utils/supabase/server";
import HomeworkRunner, { type RunnerQuestion } from "./HomeworkRunner";
import type { HomeworkResultItem } from "../actions";

export const metadata = { title: "Homework — LMS" };

export default async function HomeworkPage({ params }: { params: Promise<{ homeworkId: string }> }) {
  const { homeworkId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: hw } = await supabase
    .from("homeworks")
    .select("id, title, description, source, questions, due_date")
    .eq("id", homeworkId)
    .eq("is_published", true)
    .maybeSingle();
  if (!hw) return notFound();

  const { data: last } = await supabase
    .from("homework_submissions")
    .select("score, total, results")
    .eq("homework_id", homeworkId)
    .eq("student_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation profile={profile} />
      <main className="flex-1 min-w-0 p-4 sm:p-8 md:p-12 overflow-y-auto">
        <HomeworkRunner
          homeworkId={hw.id}
          title={hw.title}
          source={hw.source}
          questions={(hw.questions ?? []) as RunnerQuestion[]}
          last={last ? { score: last.score, total: last.total, results: last.results as HomeworkResultItem[] } : null}
        />
      </main>
    </div>
  );
}
