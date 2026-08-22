"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { grantStudentAccess, revokeStudentAccess } from "@/lib/google-drive";
import { redirect } from "next/navigation";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");
  
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thumbnailUrl = formData.get("thumbnail_url") as string;
  const isPublished = formData.get("is_published") === "on";
  const driveFolderId = formData.get("drive_folder_id") as string;

  const { data, error } = await supabase
    .from("courses")
    .insert([
      { title, description, thumbnail_url: thumbnailUrl, is_published: isPublished, drive_folder_id: driveFolderId || null }
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

export async function toggleEnrollment(formData: FormData) {
  const supabase = await createClient();
  const enrollmentId = formData.get('enrollmentId') as string;
  const isActive = formData.get('isActive') === 'on';
  
  // Fetch the enrollment to get student and course info
  const { data: enrollment, error: fetchError } = await supabase
    .from("enrollments")
    .select("student_id, course_id, courses(drive_folder_id)")
    .eq('id', enrollmentId)
    .single();
    
  if (fetchError) return { success: false, message: fetchError.message };

  // Fetch the student's email separately
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq('id', enrollment.student_id)
    .single();

  // Update status to active or revoked
  const { error } = await supabase
    .from("enrollments")
    .update({ status: isActive ? 'active' : 'revoked' })
    .eq('id', enrollmentId);

  if (error) return { success: false, message: error.message };
  
  // Grant/Revoke Google Drive access if configured
  const courseData = enrollment?.courses as any;
  const driveFolderId = Array.isArray(courseData) ? courseData[0]?.drive_folder_id : courseData?.drive_folder_id;
  const studentEmail = studentProfile?.email;
  const studentName = studentProfile?.full_name || studentEmail || 'Student';
  
  if (driveFolderId && studentEmail) {
    if (isActive) {
      const result = await grantStudentAccess(driveFolderId, studentEmail);
      if (!result.success) return { success: false, message: `DB updated but Google Drive failed: ${result.error}` };
    } else {
      const result = await revokeStudentAccess(driveFolderId, studentEmail);
      if (!result.success) return { success: false, message: `DB updated but Google Drive failed: ${result.error}` };
    }
  }

  revalidatePath('/manage/enrollments');
  return { 
    success: true, 
    message: isActive 
      ? `Access granted for ${studentName}` 
      : `Access revoked for ${studentName}`
  };
}

// --- Update & Delete Actions ---

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thumbnailUrl = formData.get("thumbnail_url") as string;
  const isPublished = formData.get("is_published") === "on";
  const driveFolderId = formData.get("drive_folder_id") as string;

  const { error } = await supabase
    .from("courses")
    .update({ title, description, thumbnail_url: thumbnailUrl, is_published: isPublished, drive_folder_id: driveFolderId || null })
    .eq('id', courseId);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
  revalidatePath("/manage/courses");
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq('id', courseId);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/courses");
  redirect("/manage/courses");
}

export async function updateUnit(unitId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;

  const { error } = await supabase
    .from("units")
    .update({ title, order_index: orderIndex })
    .eq('id', unitId);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function deleteUnit(unitId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("units").delete().eq('id', unitId);
  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function updateLesson(lessonId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const videoProvider = formData.get("video_provider") as string;
  const videoUrl = formData.get("video_url") as string;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;

  const { error } = await supabase
    .from("lessons")
    .update({ title, video_provider: videoProvider, video_url: videoUrl, order_index: orderIndex })
    .eq('id', lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq('id', lessonId);
  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function updateQuiz(quizId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;
  const showGradeImmediately = formData.get("show_grade_immediately") === "on";

  const { error } = await supabase
    .from("quizzes")
    .update({ title, description, order_index: orderIndex, show_grade_immediately: showGradeImmediately })
    .eq('id', quizId);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}

export async function deleteQuiz(quizId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq('id', quizId);
  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
}
