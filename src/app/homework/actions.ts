"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface HomeworkResultItem {
  selected: number | null;
  correct_index: number;
  is_correct: boolean;
  explanation: string | null;
}

export interface HomeworkResult {
  score: number;
  total: number;
  results: HomeworkResultItem[];
}

/** Grading happens inside the database (submit_homework) so the answer key never reaches the browser early. */
export async function submitHomework(
  homeworkId: string,
  answers: (number | null)[]
): Promise<{ success: boolean; error?: string; result?: HomeworkResult }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Please sign in again" };

  const { data, error } = await supabase.rpc("submit_homework", {
    p_homework_id: homeworkId,
    p_answers: answers,
  });
  if (error) {
    const missing = /function .* does not exist|Could not find the function/i.test(error.message);
    return { success: false, error: missing ? "Homework isn’t set up yet — ask your teacher." : error.message };
  }

  revalidatePath("/homework");
  return { success: true, result: data as HomeworkResult };
}
