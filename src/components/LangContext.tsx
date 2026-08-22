"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Lang = "en" | "ar";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  "nav.overview": { en: "Overview", ar: "نظرة عامة" },
  "nav.students": { en: "Students", ar: "الطلاب" },
  "nav.enrollments": { en: "Enrollments", ar: "التسجيلات" },
  "nav.courses": { en: "Courses", ar: "الدورات" },
  "nav.lessons": { en: "Lessons", ar: "الدروس" },
  "nav.grading": { en: "Grading", ar: "التصحيح" },
  "nav.analytics": { en: "Analytics", ar: "التحليلات" },
  "nav.exit": { en: "Exit Admin", ar: "الخروج من الإدارة" },

  // Quiz Builder
  "quiz.builder.title": { en: "Quiz Builder", ar: "منشئ الاختبار" },
  "quiz.questions": { en: "Questions", ar: "أسئلة" },
  "quiz.totalPoints": { en: "Total Points", ar: "مجموع النقاط" },
  "quiz.minutes": { en: "Minutes", ar: "دقيقة" },
  "quiz.mcq": { en: "MCQ", ar: "اختيار من متعدد" },
  "quiz.written": { en: "Written", ar: "مكتوب" },
  "quiz.noQuestions": { en: "No questions yet. Add your first question below!", ar: "لا توجد أسئلة بعد. أضف سؤالك الأول أدناه!" },
  "quiz.addQuestion": { en: "Add Question", ar: "إضافة سؤال" },
  "quiz.questionType": { en: "Question Type", ar: "نوع السؤال" },
  "quiz.multipleChoice": { en: "Multiple Choice", ar: "اختيار من متعدد" },
  "quiz.questionText": { en: "Question Text", ar: "نص السؤال" },
  "quiz.questionPlaceholder": { en: "Enter your question...", ar: "اكتب سؤالك هنا..." },
  "quiz.imageUrl": { en: "Image URL", ar: "رابط الصورة" },
  "quiz.imageOptional": { en: "(optional)", ar: "(اختياري)" },
  "quiz.points": { en: "Points", ar: "النقاط" },
  "quiz.answerOptions": { en: "Answer Options", ar: "خيارات الإجابة" },
  "quiz.correctHint": { en: "Select the radio button next to the correct answer.", ar: "اختر الإجابة الصحيحة بالنقر على الدائرة بجانبها." },
  "quiz.adding": { en: "Adding...", ar: "جاري الإضافة..." },
  "quiz.openEnded": { en: "Open-ended answer (manually graded)", ar: "إجابة مفتوحة (يتم تصحيحها يدويًا)" },
  "quiz.delete": { en: "Delete", ar: "حذف" },
  "quiz.timeLimitLabel": { en: "Time Limit", ar: "الوقت المحدد" },
  "quiz.noLimit": { en: "No limit", ar: "بدون حد" },
  "quiz.correct": { en: "correct", ar: "صحيح" },

  // Quiz Player
  "player.answered": { en: "answered", ar: "تمت الإجابة" },
  "player.lastMinute": { en: "Last minute!", ar: "الدقيقة الأخيرة!" },
  "player.hurryUp": { en: "Hurry up!", ar: "أسرع!" },
  "player.writeAnswer": { en: "Write your answer here...", ar: "اكتب إجابتك هنا..." },
  "player.autoSaved": { en: "Auto-saved", ar: "تم الحفظ تلقائيًا" },
  "player.readyToSubmit": { en: "Ready to submit?", ar: "هل أنت مستعد للتسليم؟" },
  "player.answered_of": { en: "questions answered", ar: "سؤال تمت الإجابة عليه" },
  "player.unanswered": { en: "unanswered", ar: "بدون إجابة" },
  "player.submitting": { en: "Submitting...", ar: "جاري التسليم..." },
  "player.submit": { en: "Submit Quiz", ar: "تسليم الاختبار" },
  "player.timesUp": { en: "Time's Up!", ar: "انتهى الوقت!" },
  "player.submitted": { en: "Quiz Submitted!", ar: "تم تسليم الاختبار!" },
  "player.autoSubmitted": { en: "Your answers were automatically saved and submitted.", ar: "تم حفظ إجاباتك وتسليمها تلقائيًا." },
  "player.greatJob": { en: "Great job completing the quiz!", ar: "أحسنت! لقد أكملت الاختبار!" },
  "player.mcqScore": { en: "MCQ Score", ar: "درجة أسئلة الاختيار" },
  "player.finalScore": { en: "Final Score", ar: "الدرجة النهائية" },
  "player.writtenPending": { en: "Your written answers are being reviewed by the instructor. Your final score will be updated soon.", ar: "إجاباتك المكتوبة قيد المراجعة من قبل المدرس. سيتم تحديث درجتك النهائية قريبًا." },
  "player.resultsHidden": { en: "Your quiz has been submitted. Your instructor will share your results soon.", ar: "تم تسليم اختبارك. سيشارك المدرس نتائجك قريبًا." },
  "player.writtenHidden": { en: "Your answers have been recorded and will be reviewed by your instructor.", ar: "تم تسجيل إجاباتك وستتم مراجعتها من قبل المدرس." },
  "player.backToCourse": { en: "Back to Course", ar: "العودة إلى الدورة" },
  "player.timeLimitNote": { en: "You have {n} minutes to complete this quiz.", ar: "لديك {n} دقيقة لإتمام هذا الاختبار." },
  "player.autoSaveNote": { en: "Answers are saved automatically as you type.", ar: "تُحفظ الإجابات تلقائيًا أثناء الكتابة." },
  "player.writtenGraded": { en: "Written answers will be graded by your instructor.", ar: "ستُصحَّح الإجابات المكتوبة من قبل المدرس." },
  "player.gradeShown": { en: "Your MCQ score will be shown immediately.", ar: "ستظهر درجة أسئلة الاختيار فور التسليم." },
  "player.gradeHidden": { en: "Results will be shared after grading.", ar: "ستُشارَك النتائج بعد التصحيح." },
  "player.timerWarning": { en: "Once you start, the {n}-minute timer begins.", ar: "بمجرد البدء، يبدأ مؤقت {n} دقيقة." },
  "player.startQuiz": { en: "Start Quiz", ar: "ابدأ الاختبار" },
  "player.headsUp": { en: "Heads up:", ar: "تنبيه:" },
  "player.format": { en: "Format", ar: "النوع" },
  "player.timer": { en: "Timer", ar: "المؤقت" },

  // Grading
  "grading.title": { en: "Grading Center", ar: "مركز التصحيح" },
  "grading.subtitle": { en: "Review written answers and finalize student scores.", ar: "راجع الإجابات المكتوبة وأنهِ درجات الطلاب." },
  "grading.awaiting": { en: "Awaiting Review", ar: "في انتظار المراجعة" },
  "grading.fullyGraded": { en: "Fully Graded", ar: "مصحَّح بالكامل" },
  "grading.allDone": { en: "All caught up!", ar: "تم الانتهاء من الجميع!" },
  "grading.noPending": { en: "No submissions require grading right now.", ar: "لا توجد تسليمات تحتاج إلى تصحيح الآن." },
  "grading.timedOut": { en: "Timed Out", ar: "انتهى الوقت" },
  "grading.awaitingReview": { en: "Awaiting Review", ar: "في انتظار المراجعة" },
  "grading.graded": { en: "Graded", ar: "مصحَّح" },
  "grading.submitted": { en: "Submitted", ar: "تاريخ التسليم" },
  "grading.timeLimit": { en: "Time limit", ar: "الوقت المحدد" },
  "grading.gradedAt": { en: "Graded", ar: "تاريخ التصحيح" },
  "grading.studentAnswer": { en: "Student's Answer", ar: "إجابة الطالب" },
  "grading.notAnswered": { en: "Not answered", ar: "لم يتم الإجابة" },
  "grading.pointsAwarded": { en: "Points awarded:", ar: "النقاط الممنوحة:" },
  "grading.save": { en: "Save", ar: "حفظ" },
  "grading.studentAnswer_label": { en: "Student's answer", ar: "إجابة الطالب" },

  // Analytics
  "analytics.title": { en: "Performance Analytics", ar: "تحليلات الأداء" },
  "analytics.subtitle": { en: "A bird's-eye view of student performance across all quizzes.", ar: "نظرة شاملة على أداء الطلاب في جميع الاختبارات." },
  "analytics.totalSubmissions": { en: "Total Submissions", ar: "إجمالي التسليمات" },
  "analytics.fullyGraded": { en: "Fully Graded", ar: "مصحَّح بالكامل" },
  "analytics.timedOut": { en: "Timed Out", ar: "انتهى الوقت" },
  "analytics.pendingReview": { en: "Pending Review", ar: "في انتظار المراجعة" },
  "analytics.quizPerformance": { en: "Quiz Performance", ar: "أداء الاختبارات" },
  "analytics.quizSubtitle": { en: "Average scores and pass rates per quiz.", ar: "متوسط الدرجات ونسب النجاح لكل اختبار." },
  "analytics.studentLeaderboard": { en: "Student Leaderboard", ar: "لوحة الترتيب" },
  "analytics.leaderboardSubtitle": { en: "Overall performance across all graded quizzes.", ar: "الأداء الإجمالي في جميع الاختبارات المصحَّحة." },
  "analytics.noQuizData": { en: "No quiz data yet.", ar: "لا توجد بيانات اختبار بعد." },
  "analytics.noStudentData": { en: "No student data yet.", ar: "لا توجد بيانات طالب بعد." },
  "analytics.submissions": { en: "submission", ar: "تسليم" },
  "analytics.timedOutCount": { en: "timed out", ar: "انتهى وقته" },
  "analytics.passRate": { en: "pass", ar: "نجاح" },
  "analytics.avg": { en: "Avg", ar: "متوسط" },
  "analytics.awaitingGrading": { en: "Awaiting grading", ar: "في انتظار التصحيح" },
  "analytics.quizzes": { en: "quiz", ar: "اختبار" },
  "analytics.pending": { en: "Pending", ar: "معلق" },

  // Students page
  "students.title": { en: "Students", ar: "الطلاب" },
  "students.subtitle": { en: "Manage enrolled students. Sorted by most recent activity.", ar: "إدارة الطلاب المسجلين. مرتبة حسب آخر نشاط." },
  "students.name": { en: "Student Name", ar: "اسم الطالب" },
  "students.email": { en: "Email", ar: "البريد الإلكتروني" },
  "students.lastActive": { en: "Last Active", ar: "آخر نشاط" },
  "students.joined": { en: "Joined", ar: "تاريخ الانضمام" },
  "students.actions": { en: "Actions", ar: "الإجراءات" },
  "students.manage": { en: "Manage", ar: "إدارة" },
  "students.noStudents": { en: "No students found.", ar: "لم يتم العثور على طلاب." },
  "students.activeNow": { en: "Active now", ar: "نشط الآن" },
  "students.hoursAgo": { en: "h ago", ar: "س مضت" },
  "students.daysAgo": { en: "d ago", ar: "ي مضت" },
  "students.never": { en: "Never", ar: "لم يسجل دخول" },

  // Playground
  "playground.title": { en: "Code Playground", ar: "ساحة البرمجة" },
  "playground.subtitle": { en: "Write and run Python or JavaScript directly in your browser.", ar: "اكتب وشغّل كودًا بلغة Python أو JavaScript مباشرةً في متصفحك." },
  "playground.run": { en: "Run Code", ar: "تشغيل الكود" },
  "playground.running": { en: "Running...", ar: "جاري التشغيل..." },
  "playground.clear": { en: "Clear", ar: "مسح" },
  "playground.reset": { en: "Reset", ar: "إعادة ضبط" },
  "playground.output": { en: "Output", ar: "الناتج" },
  "playground.noOutput": { en: "Output will appear here after you run the code.", ar: "سيظهر الناتج هنا بعد تشغيل الكود." },
  "playground.loading": { en: "Loading Python runtime...", ar: "جاري تحميل بيئة Python..." },
  "playground.timeout": { en: "Execution timed out (5s limit). Check for infinite loops.", ar: "انتهت مهلة التنفيذ (5 ثوانٍ). تحقق من وجود حلقات لا نهاية لها." },
  "playground.language": { en: "Language", ar: "اللغة" },
  "playground.copyCode": { en: "Copy Code", ar: "نسخ الكود" },
  "playground.copied": { en: "Copied!", ar: "تم النسخ!" },
  "nav.playground": { en: "Playground", ar: "ساحة البرمجة" },
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lms-lang") as Lang | null;
    if (saved === "ar" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lms-lang", l);
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    let str = translations[key]?.[lang] ?? translations[key]?.en ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LangContext.Provider value={{ lang, setLang, t, dir }}>
      <div dir={dir} lang={lang}>{children}</div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      title={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <span className="font-semibold">{lang === "en" ? "ع" : "EN"}</span>
    </button>
  );
}
