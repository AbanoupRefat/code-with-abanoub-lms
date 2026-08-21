"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thumbnailUrl = formData.get("thumbnail_url") as string;
  const isPublished = formData.get("is_published") === "on";

  const { data, error } = await supabase
    .from("courses")
    .insert([
      { title, description, thumbnail_url: thumbnailUrl, is_published: isPublished }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error);
    throw new Error(error.message);
  }

  revalidatePath("/manage/courses");
  revalidatePath("/manage");
  redirect(`/manage/courses/${data.id}`);
}

export async function createUnit(courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;

  const { error } = await supabase
    .from("units")
    .insert([{ course_id: courseId, title, order_index: orderIndex }]);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function createLesson(unitId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const videoProvider = formData.get("video_provider") as string;
  const videoUrl = formData.get("video_url") as string;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;

  const { error } = await supabase
    .from("lessons")
    .insert([{ 
      unit_id: unitId, 
      title, 
      video_provider: videoProvider, 
      video_url: videoUrl, 
      order_index: orderIndex 
    }]);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function enrollStudent(studentId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .insert([{ student_id: studentId, course_id: courseId }]);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/students/${studentId}`);
}

export async function unenrollStudent(studentId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .match({ student_id: studentId, course_id: courseId });

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/students/${studentId}`);
}

export async function createQuiz(unitId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;
  const showGradeImmediately = formData.get("show_grade_immediately") === "on";

  const { error } = await supabase
    .from("quizzes")
    .insert([{ 
      unit_id: unitId, 
      title, 
      description,
      order_index: orderIndex,
      show_grade_immediately: showGradeImmediately
    }]);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function approveEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ status: 'active' })
    .eq('id', enrollmentId);

  if (error) throw new Error(error.message);
  revalidatePath('/manage/enrollments');
}

export async function rejectEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq('id', enrollmentId);

  if (error) throw new Error(error.message);
  revalidatePath('/manage/enrollments');
}
