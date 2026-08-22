"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { grantStudentAccess, revokeStudentAccess } from "@/lib/google-drive";
import { sendEmail } from "@/lib/email";
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

export async function importQuestionsFromJson(quizId: string, courseId: string, jsonString: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  let questions: any[];
  try {
    const parsed = JSON.parse(jsonString);
    questions = Array.isArray(parsed) ? parsed : parsed.questions;
    if (!Array.isArray(questions)) throw new Error("JSON must be an array of questions or { questions: [...] }");
  } catch (e: any) {
    throw new Error("Invalid JSON: " + e.message);
  }

  // Get current question count to set order_index correctly
  const { data: existing } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('quiz_id', quizId);
  let orderStart = (existing?.length || 0) + 1;

  for (const q of questions) {
    if (!q.question_text || typeof q.question_text !== 'string') throw new Error("Each question must have a 'question_text' field.");
    const questionType = q.question_type === 'written' ? 'written' : 'mcq';
    const points = typeof q.points === 'number' ? q.points : 1;
    const imageUrl = q.image_url || null;

    const { data: question, error: qErr } = await supabase
      .from('quiz_questions')
      .insert([{
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: questionType,
        order_index: orderStart++,
        points,
        image_url: imageUrl,
      }])
      .select()
      .single();

    if (qErr) throw new Error("Failed to insert question: " + qErr.message);

    if (questionType === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`MCQ question "${q.question_text}" must have at least 2 options.`);
      const optionRows = q.options.map((opt: any, i: number) => ({
        question_id: question.id,
        option_text: typeof opt === 'string' ? opt : opt.text,
        is_correct: typeof opt === 'string' ? i === (q.correct_index ?? 0) : !!opt.is_correct,
      }));
      const { error: optErr } = await supabase.from('quiz_options').insert(optionRows);
      if (optErr) throw new Error("Failed to insert options: " + optErr.message);
    }
  }

  revalidatePath(`/manage/courses/${courseId}`);
  revalidatePath(`/manage/quizzes/${quizId}`);
  return { imported: questions.length };
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

export async function gradeAllWrittenAnswers(submissionId: string, grades: { answerId: string, pointsAwarded: number }[]) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  // Update all provided grades
  for (const g of grades) {
    const { error } = await supabase
      .from('quiz_submission_answers')
      .update({ points_awarded: g.pointsAwarded })
      .eq('id', g.answerId);
    if (error) throw new Error(`Failed to update answer ${g.answerId}: ${error.message}`);
  }

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

export async function notifyStudentQuizGraded(submissionId: string) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error("Unauthorized");

  const { data: submission } = await supabase
    .from('quiz_submissions')
    .select(`
      id, score, final_score, 
      profiles ( email, full_name ),
      quizzes ( title, quiz_questions(points) )
    `)
    .eq('id', submissionId)
    .single();

  if (!submission) throw new Error("Submission not found");
  
  const studentEmail = (submission.profiles as any)?.email;
  const studentName = (submission.profiles as any)?.full_name || "Student";
  const quizTitle = (submission.quizzes as any)?.title || "Quiz";
  
  if (!studentEmail) throw new Error("Student email not found");

  const totalPts = (submission.quizzes as any)?.quiz_questions?.reduce((s: number, q: any) => s + q.points, 0) || 0;
  const score = submission.final_score ?? submission.score;

  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #3b82f6;">Your Quiz Has Been Graded! 🎉</h2>
      <p>Hello ${studentName},</p>
      <p>Your recent submission for <strong>${quizTitle}</strong> has been graded by the instructor.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 18px;">Score: <strong>${score} / ${totalPts}</strong></p>
      </div>
      <p>Please log in to your Student Portal and visit the <strong>My Results</strong> page to review your detailed feedback and correct answers.</p>
      <br/>
      <p style="font-size: 12px; color: #6b7280;">This is an automated notification from Code with Abanoub LMS.</p>
    </div>
  `;

  const result = await sendEmail({
    to: studentEmail,
    subject: `Quiz Graded: ${quizTitle}`,
    html,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return { success: true };
}

// ─── Activity Tracking ────────────────────────────────────────────────────────

export async function updateLastActive() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
}

// ─── Calendar Actions ────────────────────────────────────────────────────────

export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  event_type: 'quiz' | 'lecture' | 'assignment' | 'holiday' | 'other' | 'live_session';
  event_date: string;
  course_id?: string;
  quiz_id?: string;
  meeting_url?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('calendar_events').insert([
    {
      title: data.title,
      description: data.description || null,
      event_type: data.event_type,
      event_date: data.event_date,
      course_id: data.course_id || null,
      quiz_id: data.quiz_id || null,
      meeting_url: data.meeting_url || null,
    }
  ]);
  
  if (error) {
    console.error("Error creating calendar event:", error);
    return { success: false, error: error.message };
  }

  // Notify students
  try {
    const { data: students } = await supabase.from('profiles').select('email').eq('role', 'student');
    if (students && students.length > 0) {
      const bccEmails = students.map(s => s.email).filter(e => e).join(',');
      if (bccEmails) {
        const html = `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #3b82f6;">New Event Scheduled: ${data.title}</h2>
            <p>A new event has been added to your LMS Calendar.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Type:</strong> ${data.event_type.toUpperCase()}</p>
              <p><strong>Date:</strong> ${new Date(data.event_date).toLocaleString()}</p>
              ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
            </div>
            <p>Please log in to the LMS and check your Calendar for more details.</p>
            <br/>
            <p style="font-size: 12px; color: #6b7280;">This is an automated notification from Code with Abanoub LMS.</p>
          </div>
        `;
        
        await sendEmail({
          bcc: bccEmails,
          subject: `New Calendar Event: ${data.title}`,
          html,
        });
      }
    }
  } catch (emailErr) {
    console.error("Failed to send calendar notifications:", emailErr);
  }
  
  revalidatePath('/manage/calendar');
  revalidatePath('/calendar');
  return { success: true };
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  
  if (error) {
    console.error("Error deleting calendar event:", error);
    throw new Error(error.message);
  }
  
  revalidatePath('/manage/calendar');
  revalidatePath('/calendar');
}

export async function importCalendarEventsFromJson(jsonString: string) {
  const supabase = await createClient();
  try {
    const events = JSON.parse(jsonString);
    if (!Array.isArray(events)) {
      throw new Error("JSON must be an array of events.");
    }
    
    const formattedEvents = events.map(e => ({
      title: e.title,
      description: e.description || null,
      event_type: e.event_type || 'other',
      event_date: e.event_date,
      course_id: e.course_id || null,
      quiz_id: e.quiz_id || null,
    }));
    
    const { error } = await supabase.from('calendar_events').insert(formattedEvents);
    
    if (error) {
       console.error("Bulk insert error:", error);
       throw new Error(error.message);
    }
    
    revalidatePath('/manage/calendar');
    revalidatePath('/calendar');
    return { success: true };
  } catch (error: any) {
    console.error("Failed to import calendar JSON:", error);
    return { success: false, error: error.message };
  }
}

