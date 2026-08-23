(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/manage/data:1684b1 [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateLastActive",
    ()=>$$RSC_SERVER_ACTION_25
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"002f51f20dbcee8817035ff068526e8582c577ac44":{"name":"updateLastActive"}},"src/app/manage/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("002f51f20dbcee8817035ff068526e8582c577ac44", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "updateLastActive");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ActivityTracker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ActivityTracker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manage$2f$data$3a$1684b1__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/app/manage/data:1684b1 [app-client] (ecmascript) <text/javascript>");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
function ActivityTracker() {
    _s();
    const lastUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const update = async ()=>{
        const now = Date.now();
        if (now - lastUpdated.current < THROTTLE_MS) return;
        lastUpdated.current = now;
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$manage$2f$data$3a$1684b1__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["updateLastActive"])();
        } catch  {}
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ActivityTracker.useEffect": ()=>{
            update(); // fire on mount
            const handleActivity = {
                "ActivityTracker.useEffect.handleActivity": ()=>update()
            }["ActivityTracker.useEffect.handleActivity"];
            window.addEventListener('click', handleActivity, {
                passive: true
            });
            window.addEventListener('keydown', handleActivity, {
                passive: true
            });
            window.addEventListener('scroll', handleActivity, {
                passive: true
            });
            return ({
                "ActivityTracker.useEffect": ()=>{
                    window.removeEventListener('click', handleActivity);
                    window.removeEventListener('keydown', handleActivity);
                    window.removeEventListener('scroll', handleActivity);
                }
            })["ActivityTracker.useEffect"];
        }
    }["ActivityTracker.useEffect"], []);
    return null;
}
_s(ActivityTracker, "Vla6yTy7GV18Xi2bew/p5PrJCnI=");
_c = ActivityTracker;
var _c;
__turbopack_context__.k.register(_c, "ActivityTracker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/LangContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LangProvider",
    ()=>LangProvider,
    "LangToggle",
    ()=>LangToggle,
    "useLang",
    ()=>useLang
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
"use client";
;
const translations = {
    // Navigation
    "nav.overview": {
        en: "Overview",
        ar: "نظرة عامة"
    },
    "nav.students": {
        en: "Students",
        ar: "الطلاب"
    },
    "nav.enrollments": {
        en: "Enrollments",
        ar: "التسجيلات"
    },
    "nav.courses": {
        en: "Courses",
        ar: "الدورات"
    },
    "nav.lessons": {
        en: "Lessons",
        ar: "الدروس"
    },
    "nav.grading": {
        en: "Grading",
        ar: "التصحيح"
    },
    "nav.analytics": {
        en: "Analytics",
        ar: "التحليلات"
    },
    "nav.exit": {
        en: "Exit Admin",
        ar: "الخروج من الإدارة"
    },
    // Quiz Builder
    "quiz.builder.title": {
        en: "Quiz Builder",
        ar: "منشئ الاختبار"
    },
    "quiz.questions": {
        en: "Questions",
        ar: "أسئلة"
    },
    "quiz.totalPoints": {
        en: "Total Points",
        ar: "مجموع النقاط"
    },
    "quiz.minutes": {
        en: "Minutes",
        ar: "دقيقة"
    },
    "quiz.mcq": {
        en: "MCQ",
        ar: "اختيار من متعدد"
    },
    "quiz.written": {
        en: "Written",
        ar: "مكتوب"
    },
    "quiz.noQuestions": {
        en: "No questions yet. Add your first question below!",
        ar: "لا توجد أسئلة بعد. أضف سؤالك الأول أدناه!"
    },
    "quiz.addQuestion": {
        en: "Add Question",
        ar: "إضافة سؤال"
    },
    "quiz.questionType": {
        en: "Question Type",
        ar: "نوع السؤال"
    },
    "quiz.multipleChoice": {
        en: "Multiple Choice",
        ar: "اختيار من متعدد"
    },
    "quiz.questionText": {
        en: "Question Text",
        ar: "نص السؤال"
    },
    "quiz.questionPlaceholder": {
        en: "Enter your question...",
        ar: "اكتب سؤالك هنا..."
    },
    "quiz.imageUrl": {
        en: "Image URL",
        ar: "رابط الصورة"
    },
    "quiz.imageOptional": {
        en: "(optional)",
        ar: "(اختياري)"
    },
    "quiz.points": {
        en: "Points",
        ar: "النقاط"
    },
    "quiz.answerOptions": {
        en: "Answer Options",
        ar: "خيارات الإجابة"
    },
    "quiz.correctHint": {
        en: "Select the radio button next to the correct answer.",
        ar: "اختر الإجابة الصحيحة بالنقر على الدائرة بجانبها."
    },
    "quiz.adding": {
        en: "Adding...",
        ar: "جاري الإضافة..."
    },
    "quiz.openEnded": {
        en: "Open-ended answer (manually graded)",
        ar: "إجابة مفتوحة (يتم تصحيحها يدويًا)"
    },
    "quiz.delete": {
        en: "Delete",
        ar: "حذف"
    },
    "quiz.timeLimitLabel": {
        en: "Time Limit",
        ar: "الوقت المحدد"
    },
    "quiz.noLimit": {
        en: "No limit",
        ar: "بدون حد"
    },
    "quiz.correct": {
        en: "correct",
        ar: "صحيح"
    },
    // Quiz Player
    "player.answered": {
        en: "answered",
        ar: "تمت الإجابة"
    },
    "player.lastMinute": {
        en: "Last minute!",
        ar: "الدقيقة الأخيرة!"
    },
    "player.hurryUp": {
        en: "Hurry up!",
        ar: "أسرع!"
    },
    "player.writeAnswer": {
        en: "Write your answer here...",
        ar: "اكتب إجابتك هنا..."
    },
    "player.autoSaved": {
        en: "Auto-saved",
        ar: "تم الحفظ تلقائيًا"
    },
    "player.readyToSubmit": {
        en: "Ready to submit?",
        ar: "هل أنت مستعد للتسليم؟"
    },
    "player.answered_of": {
        en: "questions answered",
        ar: "سؤال تمت الإجابة عليه"
    },
    "player.unanswered": {
        en: "unanswered",
        ar: "بدون إجابة"
    },
    "player.submitting": {
        en: "Submitting...",
        ar: "جاري التسليم..."
    },
    "player.submit": {
        en: "Submit Quiz",
        ar: "تسليم الاختبار"
    },
    "player.timesUp": {
        en: "Time's Up!",
        ar: "انتهى الوقت!"
    },
    "player.submitted": {
        en: "Quiz Submitted!",
        ar: "تم تسليم الاختبار!"
    },
    "player.autoSubmitted": {
        en: "Your answers were automatically saved and submitted.",
        ar: "تم حفظ إجاباتك وتسليمها تلقائيًا."
    },
    "player.greatJob": {
        en: "Great job completing the quiz!",
        ar: "أحسنت! لقد أكملت الاختبار!"
    },
    "player.mcqScore": {
        en: "MCQ Score",
        ar: "درجة أسئلة الاختيار"
    },
    "player.finalScore": {
        en: "Final Score",
        ar: "الدرجة النهائية"
    },
    "player.writtenPending": {
        en: "Your written answers are being reviewed by the instructor. Your final score will be updated soon.",
        ar: "إجاباتك المكتوبة قيد المراجعة من قبل المدرس. سيتم تحديث درجتك النهائية قريبًا."
    },
    "player.resultsHidden": {
        en: "Your quiz has been submitted. Your instructor will share your results soon.",
        ar: "تم تسليم اختبارك. سيشارك المدرس نتائجك قريبًا."
    },
    "player.writtenHidden": {
        en: "Your answers have been recorded and will be reviewed by your instructor.",
        ar: "تم تسجيل إجاباتك وستتم مراجعتها من قبل المدرس."
    },
    "player.backToCourse": {
        en: "Back to Course",
        ar: "العودة إلى الدورة"
    },
    "player.timeLimitNote": {
        en: "You have {n} minutes to complete this quiz.",
        ar: "لديك {n} دقيقة لإتمام هذا الاختبار."
    },
    "player.autoSaveNote": {
        en: "Answers are saved automatically as you type.",
        ar: "تُحفظ الإجابات تلقائيًا أثناء الكتابة."
    },
    "player.writtenGraded": {
        en: "Written answers will be graded by your instructor.",
        ar: "ستُصحَّح الإجابات المكتوبة من قبل المدرس."
    },
    "player.gradeShown": {
        en: "Your MCQ score will be shown immediately.",
        ar: "ستظهر درجة أسئلة الاختيار فور التسليم."
    },
    "player.gradeHidden": {
        en: "Results will be shared after grading.",
        ar: "ستُشارَك النتائج بعد التصحيح."
    },
    "player.timerWarning": {
        en: "Once you start, the {n}-minute timer begins.",
        ar: "بمجرد البدء، يبدأ مؤقت {n} دقيقة."
    },
    "player.startQuiz": {
        en: "Start Quiz",
        ar: "ابدأ الاختبار"
    },
    "player.headsUp": {
        en: "Heads up:",
        ar: "تنبيه:"
    },
    "player.format": {
        en: "Format",
        ar: "النوع"
    },
    "player.timer": {
        en: "Timer",
        ar: "المؤقت"
    },
    // Grading
    "grading.title": {
        en: "Grading Center",
        ar: "مركز التصحيح"
    },
    "grading.subtitle": {
        en: "Review written answers and finalize student scores.",
        ar: "راجع الإجابات المكتوبة وأنهِ درجات الطلاب."
    },
    "grading.awaiting": {
        en: "Awaiting Review",
        ar: "في انتظار المراجعة"
    },
    "grading.fullyGraded": {
        en: "Fully Graded",
        ar: "مصحَّح بالكامل"
    },
    "grading.allDone": {
        en: "All caught up!",
        ar: "تم الانتهاء من الجميع!"
    },
    "grading.noPending": {
        en: "No submissions require grading right now.",
        ar: "لا توجد تسليمات تحتاج إلى تصحيح الآن."
    },
    "grading.timedOut": {
        en: "Timed Out",
        ar: "انتهى الوقت"
    },
    "grading.awaitingReview": {
        en: "Awaiting Review",
        ar: "في انتظار المراجعة"
    },
    "grading.graded": {
        en: "Graded",
        ar: "مصحَّح"
    },
    "grading.submitted": {
        en: "Submitted",
        ar: "تاريخ التسليم"
    },
    "grading.timeLimit": {
        en: "Time limit",
        ar: "الوقت المحدد"
    },
    "grading.gradedAt": {
        en: "Graded",
        ar: "تاريخ التصحيح"
    },
    "grading.studentAnswer": {
        en: "Student's Answer",
        ar: "إجابة الطالب"
    },
    "grading.notAnswered": {
        en: "Not answered",
        ar: "لم يتم الإجابة"
    },
    "grading.pointsAwarded": {
        en: "Points awarded:",
        ar: "النقاط الممنوحة:"
    },
    "grading.save": {
        en: "Save",
        ar: "حفظ"
    },
    "grading.studentAnswer_label": {
        en: "Student's answer",
        ar: "إجابة الطالب"
    },
    // Analytics
    "analytics.title": {
        en: "Performance Analytics",
        ar: "تحليلات الأداء"
    },
    "analytics.subtitle": {
        en: "A bird's-eye view of student performance across all quizzes.",
        ar: "نظرة شاملة على أداء الطلاب في جميع الاختبارات."
    },
    "analytics.totalSubmissions": {
        en: "Total Submissions",
        ar: "إجمالي التسليمات"
    },
    "analytics.fullyGraded": {
        en: "Fully Graded",
        ar: "مصحَّح بالكامل"
    },
    "analytics.timedOut": {
        en: "Timed Out",
        ar: "انتهى الوقت"
    },
    "analytics.pendingReview": {
        en: "Pending Review",
        ar: "في انتظار المراجعة"
    },
    "analytics.quizPerformance": {
        en: "Quiz Performance",
        ar: "أداء الاختبارات"
    },
    "analytics.quizSubtitle": {
        en: "Average scores and pass rates per quiz.",
        ar: "متوسط الدرجات ونسب النجاح لكل اختبار."
    },
    "analytics.studentLeaderboard": {
        en: "Student Leaderboard",
        ar: "لوحة الترتيب"
    },
    "analytics.leaderboardSubtitle": {
        en: "Overall performance across all graded quizzes.",
        ar: "الأداء الإجمالي في جميع الاختبارات المصحَّحة."
    },
    "analytics.noQuizData": {
        en: "No quiz data yet.",
        ar: "لا توجد بيانات اختبار بعد."
    },
    "analytics.noStudentData": {
        en: "No student data yet.",
        ar: "لا توجد بيانات طالب بعد."
    },
    "analytics.submissions": {
        en: "submission",
        ar: "تسليم"
    },
    "analytics.timedOutCount": {
        en: "timed out",
        ar: "انتهى وقته"
    },
    "analytics.passRate": {
        en: "pass",
        ar: "نجاح"
    },
    "analytics.avg": {
        en: "Avg",
        ar: "متوسط"
    },
    "analytics.awaitingGrading": {
        en: "Awaiting grading",
        ar: "في انتظار التصحيح"
    },
    "analytics.quizzes": {
        en: "quiz",
        ar: "اختبار"
    },
    "analytics.pending": {
        en: "Pending",
        ar: "معلق"
    },
    // Students page
    "students.title": {
        en: "Students",
        ar: "الطلاب"
    },
    "students.subtitle": {
        en: "Manage enrolled students. Sorted by most recent activity.",
        ar: "إدارة الطلاب المسجلين. مرتبة حسب آخر نشاط."
    },
    "students.name": {
        en: "Student Name",
        ar: "اسم الطالب"
    },
    "students.email": {
        en: "Email",
        ar: "البريد الإلكتروني"
    },
    "students.lastActive": {
        en: "Last Active",
        ar: "آخر نشاط"
    },
    "students.joined": {
        en: "Joined",
        ar: "تاريخ الانضمام"
    },
    "students.actions": {
        en: "Actions",
        ar: "الإجراءات"
    },
    "students.manage": {
        en: "Manage",
        ar: "إدارة"
    },
    "students.noStudents": {
        en: "No students found.",
        ar: "لم يتم العثور على طلاب."
    },
    "students.activeNow": {
        en: "Active now",
        ar: "نشط الآن"
    },
    "students.hoursAgo": {
        en: "h ago",
        ar: "س مضت"
    },
    "students.daysAgo": {
        en: "d ago",
        ar: "ي مضت"
    },
    "students.never": {
        en: "Never",
        ar: "لم يسجل دخول"
    },
    // Playground
    "playground.title": {
        en: "Code Playground",
        ar: "الملعب البرمجي"
    },
    "playground.subtitle": {
        en: "Write and run Python or JavaScript directly in your browser.",
        ar: "اكتب وشغّل كودًا بلغة Python أو JavaScript مباشرةً في متصفحك."
    },
    "playground.run": {
        en: "Run Code",
        ar: "تشغيل الكود"
    },
    "playground.running": {
        en: "Running...",
        ar: "جاري التشغيل..."
    },
    "playground.clear": {
        en: "Clear",
        ar: "مسح"
    },
    "playground.reset": {
        en: "Reset",
        ar: "إعادة ضبط"
    },
    "playground.output": {
        en: "Output",
        ar: "الناتج"
    },
    "playground.noOutput": {
        en: "Output will appear here after you run the code.",
        ar: "سيظهر الناتج هنا بعد تشغيل الكود."
    },
    "playground.loading": {
        en: "Loading Python runtime...",
        ar: "جاري تحميل بيئة Python..."
    },
    "playground.timeout": {
        en: "Execution timed out (5s limit). Check for infinite loops.",
        ar: "انتهت مهلة التنفيذ (5 ثوانٍ). تحقق من وجود حلقات لا نهاية لها."
    },
    "playground.language": {
        en: "Language",
        ar: "اللغة"
    },
    "playground.copyCode": {
        en: "Copy Code",
        ar: "نسخ الكود"
    },
    "playground.clearCode": {
        en: "Clear Code",
        ar: "مسح الكود"
    },
    "playground.copied": {
        en: "Copied!",
        ar: "تم النسخ!"
    },
    "nav.playground": {
        en: "Playground",
        ar: "الملعب"
    },
    "nav.calendar": {
        en: "Calendar",
        ar: "التقويم"
    },
    // Calendar
    "calendar.title": {
        en: "Curriculum Calendar",
        ar: "تقويم المنهج"
    },
    "calendar.subtitle": {
        en: "Schedule of upcoming quizzes, lectures, and milestones.",
        ar: "جدول الاختبارات والمحاضرات والمناسبات القادمة."
    },
    "calendar.adminSubtitle": {
        en: "Manage upcoming quizzes, lectures, and assignments manually or import from JSON.",
        ar: "أدر الاختبارات والمحاضرات القادمة يدويًا أو عبر استيراد JSON."
    },
    "calendar.upcoming": {
        en: "Upcoming Events",
        ar: "الأحداث القادمة"
    },
    "calendar.addEvent": {
        en: "Add Event",
        ar: "إضافة حدث"
    },
    "calendar.eventTitle": {
        en: "Event Title",
        ar: "عنوان الحدث"
    },
    "calendar.eventDesc": {
        en: "Description",
        ar: "الوصف"
    },
    "calendar.eventType": {
        en: "Type",
        ar: "النوع"
    },
    "calendar.eventDate": {
        en: "Date & Time",
        ar: "التاريخ والوقت"
    },
    "calendar.noEvents": {
        en: "No events scheduled.",
        ar: "لا توجد أحداث مجدولة."
    },
    "calendar.typeQuiz": {
        en: "Quiz",
        ar: "اختبار"
    },
    "calendar.typeLecture": {
        en: "Lecture",
        ar: "محاضرة"
    },
    "calendar.typeAssignment": {
        en: "Assignment",
        ar: "تكليف"
    },
    "calendar.typeHoliday": {
        en: "Holiday",
        ar: "عطلة"
    },
    "calendar.typeOther": {
        en: "Other",
        ar: "أخرى"
    },
    "calendar.jsonImport": {
        en: "Bulk Import JSON",
        ar: "استيراد JSON"
    },
    "calendar.importBtn": {
        en: "Import Events",
        ar: "استيراد الأحداث"
    },
    "calendar.copyPrompt": {
        en: "Copy AI Prompt",
        ar: "نسخ موجه الذكاء الاصطناعي"
    },
    "calendar.deleteConfirm": {
        en: "Are you sure you want to delete this event?",
        ar: "هل أنت متأكد من حذف هذا الحدث؟"
    },
    // Grading UI
    "grading.all": {
        en: "All",
        ar: "الكل"
    },
    "grading.pending": {
        en: "Pending Review",
        ar: "في انتظار المراجعة"
    },
    "grading.completed": {
        en: "Completed",
        ar: "مكتمل"
    },
    "grading.batchSave": {
        en: "Submit All Grades",
        ar: "إرسال كل الدرجات"
    },
    "grading.mcqSection": {
        en: "Auto-Graded (MCQ)",
        ar: "تصحيح تلقائي (اختيار من متعدد)"
    },
    "grading.writtenSection": {
        en: "Manual Review (Written)",
        ar: "مراجعة يدوية (مكتوب)"
    },
    "grading.markZero": {
        en: "Mark ungraded as 0",
        ar: "اعتبار غير المصحح صفرًا"
    },
    "grading.totalScore": {
        en: "Total Score",
        ar: "الدرجة الكلية"
    },
    "grading.notifyStudent": {
        en: "Notify Student",
        ar: "إبلاغ الطالب"
    },
    // Analytics UI
    "analytics.myResults": {
        en: "My Results",
        ar: "نتائجي"
    },
    "analytics.overallAvg": {
        en: "Overall Average",
        ar: "المتوسط العام"
    },
    "analytics.quizzesTaken": {
        en: "Quizzes Taken",
        ar: "الاختبارات المنجزة"
    },
    "analytics.recentActivity": {
        en: "Recent Activity",
        ar: "النشاط الأخير"
    },
    "analytics.performanceTrend": {
        en: "Performance Trend",
        ar: "اتجاه الأداء"
    },
    "analytics.quizHistory": {
        en: "Quiz History",
        ar: "سجل الاختبارات"
    },
    "analytics.score": {
        en: "Score",
        ar: "الدرجة"
    },
    "analytics.date": {
        en: "Date",
        ar: "التاريخ"
    },
    "analytics.status": {
        en: "Status",
        ar: "الحالة"
    },
    "analytics.best": {
        en: "Best Performance",
        ar: "أفضل أداء"
    },
    "analytics.needsWork": {
        en: "Needs Review",
        ar: "يحتاج مراجعة"
    }
};
const LangContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    lang: "en",
    setLang: ()=>{},
    t: (k)=>k,
    dir: "ltr"
});
function LangProvider({ children }) {
    _s();
    const [lang, setLangState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("en");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LangProvider.useEffect": ()=>{
            const saved = localStorage.getItem("lms-lang");
            if (saved === "ar" || saved === "en") setLangState(saved);
        }
    }["LangProvider.useEffect"], []);
    const setLang = (l)=>{
        setLangState(l);
        localStorage.setItem("lms-lang", l);
    };
    const t = (key, vars)=>{
        let str = translations[key]?.[lang] ?? translations[key]?.en ?? key;
        if (vars) {
            Object.entries(vars).forEach(([k, v])=>{
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    };
    const dir = lang === "ar" ? "rtl" : "ltr";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LangContext.Provider, {
        value: {
            lang,
            setLang,
            t,
            dir
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            dir: dir,
            lang: lang,
            children: children
        }, void 0, false, {
            fileName: "[project]/src/components/LangContext.tsx",
            lineNumber: 235,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/LangContext.tsx",
        lineNumber: 234,
        columnNumber: 5
    }, this);
}
_s(LangProvider, "TspRo+eopijjxX4OT1zicYPxTno=");
_c = LangProvider;
function useLang() {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LangContext);
}
_s1(useLang, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
function LangToggle() {
    _s2();
    const { lang, setLang } = useLang();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: ()=>setLang(lang === "en" ? "ar" : "en"),
        className: "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
        title: lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "font-semibold",
            children: lang === "en" ? "ع" : "EN"
        }, void 0, false, {
            fileName: "[project]/src/components/LangContext.tsx",
            lineNumber: 252,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/LangContext.tsx",
        lineNumber: 247,
        columnNumber: 5
    }, this);
}
_s2(LangToggle, "bo49fKWoYd/YYtFR+MvJoYnk/BE=", false, function() {
    return [
        useLang
    ];
});
_c1 = LangToggle;
var _c, _c1;
__turbopack_context__.k.register(_c, "LangProvider");
__turbopack_context__.k.register(_c1, "LangToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_13yydr-._.js.map