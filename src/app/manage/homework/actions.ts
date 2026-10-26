"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { parseHomeworkJson } from "@/lib/homework";

type ActionResult = { success: boolean; error?: string; id?: string };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, error: "Admin privileges required" };
  return { supabase, error: null as string | null };
}

function friendly(message: string): string {
  if (/relation .* does not exist|Could not find the table/i.test(message)) {
    return "Homework tables are missing — run the 20261026_homework.sql migration in Supabase.";
  }
  return message;
}

export async function importHomework(input: {
  raw: string;
  title?: string;
  dueDate?: string | null;
  published: boolean;
}): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const parsed = parseHomeworkJson(input.raw);
  if (!parsed.ok) return { success: false, error: parsed.errors[0] };

  const title = input.title?.trim() || parsed.data.title;
  if (!title) return { success: false, error: "Give the homework a title" };
  const due = input.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate) ? input.dueDate : null;

  const { data: hw, error } = await supabase
    .from("homeworks")
    .insert({
      title,
      description: parsed.data.description,
      source: parsed.data.source,
      // students receive questions + options only; the key goes to its own admin-only table
      questions: parsed.data.questions.map((q) => ({ question: q.question, options: q.options })),
      is_published: input.published,
      due_date: due,
    })
    .select("id")
    .single();
  if (error || !hw) return { success: false, error: friendly(error?.message ?? "Could not save homework") };

  const { error: keyError } = await supabase.from("homework_keys").insert({
    homework_id: hw.id,
    answers: parsed.data.questions.map((q) => ({ correct_index: q.correct_index, explanation: q.explanation })),
  });
  if (keyError) {
    await supabase.from("homeworks").delete().eq("id", hw.id); // don't leave a homework without a key
    return { success: false, error: friendly(keyError.message) };
  }

  revalidatePath("/manage/homework");
  revalidatePath("/homework");
  return { success: true, id: hw.id };
}

export async function setHomeworkPublished(id: string, published: boolean): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { data, error } = await supabase.from("homeworks").update({ is_published: published }).eq("id", id).select("id");
  if (error) return { success: false, error: friendly(error.message) };
  if (!data?.length) return { success: false, error: "Nothing was updated (permissions?)" };

  revalidatePath("/manage/homework");
  revalidatePath("/homework");
  return { success: true };
}

export async function deleteHomework(id: string): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { success: false, error: authError };

  const { data, error } = await supabase.from("homeworks").delete().eq("id", id).select("id");
  if (error) return { success: false, error: friendly(error.message) };
  if (!data?.length) return { success: false, error: "Nothing was deleted (permissions?)" };

  revalidatePath("/manage/homework");
  revalidatePath("/homework");
  return { success: true };
}
