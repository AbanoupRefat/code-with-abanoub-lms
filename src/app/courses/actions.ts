"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleLessonComplete(lessonId: string, courseId: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (currentStatus) {
    // If it was complete, mark incomplete by deleting the progress record or setting it to false
    await supabase
      .from('lesson_progress')
      .delete()
      .eq('student_id', user.id)
      .eq('lesson_id', lessonId);
  } else {
    // Mark as complete
    await supabase
      .from('lesson_progress')
      .upsert({
        student_id: user.id,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_id, lesson_id' });
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/dashboard`);
}

export async function requestEnrollment(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('enrollments')
    .insert([{ student_id: user.id, course_id: courseId, status: 'pending' }]);

  if (error) throw new Error(error.message);
  revalidatePath(`/courses`);
  revalidatePath(`/courses/${courseId}`);
}
