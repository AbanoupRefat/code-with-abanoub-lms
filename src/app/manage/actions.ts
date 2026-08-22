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
  const timeLimitRaw = formData.get("time_limit_minutes") as string;
  const timeLimitMinutes = timeLimitRaw ? parseInt(timeLimitRaw) : null;

  const { error } = await supabase
    .from("quizzes")
    .insert([{ 
      unit_id: unitId, 
      title, 
      description,
      order_index: orderIndex,
      show_grade_immediately: showGradeImmediately,
      time_limit_minutes: timeLimitMinutes,
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
  const timeLimitRaw = formData.get("time_limit_minutes") as string;
  const timeLimitMinutes = timeLimitRaw ? parseInt(timeLimitRaw) : null;

  const { error } = await supabase
    .from("quizzes")
    .update({ title, description, order_index: orderIndex, show_grade_immediately: showGradeImmediately, time_limit_minutes: timeLimitMinutes })
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

// ─── Quiz Question Actions ───────────────────────────────────────────────────

export async function createQuizQuestion(quizId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const questionText = formData.get("question_text") as string;
  const questionType = (formData.get("question_type") as string) || 'mcq';
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;
  const points = parseInt(formData.get("points") as string) || 1;
  const imageUrl = (formData.get("image_url") as string) || null;

  const { data: question, error } = await supabase
    .from("quiz_questions")
    .insert([{ quiz_id: quizId, question_text: questionText, question_type: questionType, order_index: orderIndex, points, image_url: imageUrl }])
    .select().single();

  if (error) throw new Error(error.message);

  // If MCQ, also create the options
  if (questionType === 'mcq') {
    const optionsRaw = formData.get("options") as string;
    const correctIndexRaw = formData.get("correct_index") as string;
    if (optionsRaw) {
      const options = JSON.parse(optionsRaw) as string[];
      const correctIndex = parseInt(correctIndexRaw) || 0;
      const optionRows = options.map((text, i) => ({
        question_id: question.id,
        option_text: text,
        is_correct: i === correctIndex,
      }));
      const { error: optErr } = await supabase.from("quiz_options").insert(optionRows);
      if (optErr) throw new Error(optErr.message);
    }
  }

  revalidatePath(`/manage/courses/${courseId}`);
  revalidatePath(`/manage/quizzes/${quizId}`);
}

export async function updateQuizQuestion(questionId: string, quizId: string, courseId: string, formData: FormData) {
  const supabase = await createClient();
  const questionText = formData.get("question_text") as string;
  const points = parseInt(formData.get("points") as string) || 1;
  const imageUrl = (formData.get("image_url") as string) || null;
  const orderIndex = parseInt(formData.get("order_index") as string) || 0;

  const { error } = await supabase
    .from("quiz_questions")
    .update({ question_text: questionText, points, image_url: imageUrl, order_index: orderIndex })
    .eq('id', questionId);

  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
  revalidatePath(`/manage/quizzes/${quizId}`);
}

export async function deleteQuizQuestion(questionId: string, quizId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq('id', questionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/manage/courses/${courseId}`);
  revalidatePath(`/manage/quizzes/${quizId}`);
}

// ─── Student Quiz Player Actions ─────────────────────────────────────────────

export async function startQuiz(quizId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if there is already an in-progress submission
  const { data: existing } = await supabase
    .from('quiz_submissions')
    .select('id, status, started_at')
    .eq('quiz_id', quizId)
    .eq('student_id', user.id)
    .maybeSingle();

  if (existing) return { submissionId: existing.id, isExisting: true };

  // Create a new in-progress submission
  const { data, error } = await supabase
    .from('quiz_submissions')
    .insert([{ quiz_id: quizId, student_id: user.id, status: 'in_progress', started_at: new Date().toISOString(), score: 0 }])
    .select().single();

  if (error) throw new Error(error.message);
  return { submissionId: data.id, isExisting: false };
}

export async function saveQuizAnswer(submissionId: string, questionId: string, selectedOptionId: string | null, textAnswer: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('quiz_submission_answers')
    .upsert({
      submission_id: submissionId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      text_answer: textAnswer,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'submission_id,question_id' });

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function submitQuiz(submissionId: string, quizId: string, timedOut: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch all answers for this submission
  const { data: answers, error: answersError } = await supabase
    .from('quiz_submission_answers')
    .select('id, question_id, selected_option_id, text_answer')
    .eq('submission_id', submissionId);

  if (answersError) throw new Error(answersError.message);

  // Fetch all questions for the quiz to auto-grade MCQs
  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('id, question_type, points, quiz_options(id, is_correct)')
    .eq('quiz_id', quizId);

  if (questionsError) throw new Error(questionsError.message);

  let mcqScore = 0;
  let totalMcqPoints = 0;
  let hasWrittenQuestions = false;
  const answerUpdates: { id: string; is_correct: boolean | null; points_awarded: number }[] = [];

  for (const question of questions || []) {
    if (question.question_type === 'mcq') {
      totalMcqPoints += question.points;
      const answer = answers?.find(a => a.question_id === question.id);
      const correctOption = (question.quiz_options as any[])?.find((o: any) => o.is_correct);
      const isCorrect = answer?.selected_option_id ? answer.selected_option_id === correctOption?.id : false;
      const pointsAwarded = isCorrect ? question.points : 0;
      mcqScore += pointsAwarded;
      if (answer) {
        answerUpdates.push({ id: answer.id, is_correct: isCorrect, points_awarded: pointsAwarded });
      }
    } else {
      hasWrittenQuestions = true;
    }
  }

  // Update individual answer grades for MCQs
  for (const update of answerUpdates) {
    await supabase.from('quiz_submission_answers').update({ is_correct: update.is_correct, points_awarded: update.points_awarded }).eq('id', update.id);
  }

  // Determine final status
  const newStatus = hasWrittenQuestions ? 'submitted' : 'graded';
  const finalScore = hasWrittenQuestions ? null : mcqScore;

  const { error: updateError } = await supabase
    .from('quiz_submissions')
    .update({
      status: newStatus,
      score: mcqScore,
      mcq_score: mcqScore,
      final_score: finalScore,
      timed_out: timedOut,
      graded_at: hasWrittenQuestions ? null : new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (updateError) throw new Error(updateError.message);
  return { success: true, mcqScore, totalMcqPoints, hasWrittenQuestions, status: newStatus };
}

export async function gradeWrittenAnswer(answerId: string, pointsAwarded: number, submissionId: string) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  const { error } = await supabase
    .from('quiz_submission_answers')
    .update({ points_awarded: pointsAwarded })
    .eq('id', answerId);

  if (error) throw new Error(error.message);

  // Recalculate final score for this submission
  const { data: allAnswers } = await supabase
    .from('quiz_submission_answers')
    .select('points_awarded, question_id, quiz_questions(question_type)')
    .eq('submission_id', submissionId);

  // Check if all written questions are graded
  const writtenAnswers = allAnswers?.filter((a: any) => a.quiz_questions?.question_type === 'written') || [];
  const allWrittenGraded = writtenAnswers.every((a: any) => a.points_awarded !== null);
  const totalScore = allAnswers?.reduce((sum: number, a: any) => sum + (a.points_awarded || 0), 0) || 0;

  const updatePayload: any = { final_score: totalScore, score: totalScore };
  if (allWrittenGraded) {
    updatePayload.status = 'graded';
    updatePayload.graded_at = new Date().toISOString();
  }

  await supabase.from('quiz_submissions').update(updatePayload).eq('id', submissionId);
  revalidatePath('/manage/grading');
  return { success: true };
}

// ─── Activity Tracking ────────────────────────────────────────────────────────

export async function updateLastActive() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
}
