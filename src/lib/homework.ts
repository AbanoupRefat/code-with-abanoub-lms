// Shared by the admin import screen (live validation) and the import server action.

export interface ParsedQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

export interface ParsedHomework {
  title: string;
  description: string | null;
  source: string | null;
  questions: ParsedQuestion[];
}

export type ParseResult =
  | { ok: true; data: ParsedHomework; warnings: string[] }
  | { ok: false; errors: string[] };

const MAX_QUESTIONS = 100;
const LETTERS = "ABCDEF";

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Strips ```json fences and any chatter around the JSON object, then validates it. */
export function parseHomeworkJson(raw: string): ParseResult {
  let text = (raw || "").trim();
  if (!text) return { ok: false, errors: ["Paste the JSON from Claude first."] };

  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  // Drop any chatter before/after the JSON ("Sure! Here it is: ...")
  if (!/^[[{]/.test(text)) {
    const start = text.search(/[[{]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start >= 0 && end > start) text = text.slice(start, end + 1);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`This is not valid JSON (${e instanceof Error ? e.message : "parse error"}). Ask Claude to reply with JSON only.`] };
  }

  // Accept a bare array of questions too
  const obj = (Array.isArray(json) ? { questions: json } : json) as Record<string, unknown>;
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.questions)) {
    return { ok: false, errors: ['Missing a "questions" array.'] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const questions: ParsedQuestion[] = [];

  if (obj.questions.length === 0) errors.push("The questions array is empty.");
  if (obj.questions.length > MAX_QUESTIONS) errors.push(`Too many questions (max ${MAX_QUESTIONS}).`);

  obj.questions.slice(0, MAX_QUESTIONS).forEach((item, idx) => {
    const n = idx + 1;
    const q = item as Record<string, unknown>;
    const question = clean(q?.question);
    if (!question) {
      errors.push(`Question ${n}: missing "question" text.`);
      return;
    }

    const options = Array.isArray(q.options) ? q.options.map(clean) : [];
    if (options.length < 2 || options.length > 6 || options.some((o) => !o)) {
      errors.push(`Question ${n}: needs 2–6 non-empty "options".`);
      return;
    }
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
      warnings.push(`Question ${n}: two options are identical.`);
    }

    // Correct answer: "answer": "B"  |  "correct_index": 1 (0-based)  |  answer text equal to an option
    let correct = -1;
    const ans = q.answer ?? q.correct_answer;
    if (typeof q.correct_index === "number" && Number.isInteger(q.correct_index)) {
      correct = q.correct_index;
    } else if (typeof ans === "string") {
      const a = ans.trim();
      const byLetter = a.length === 1 ? LETTERS.indexOf(a.toUpperCase()) : -1;
      correct = byLetter >= 0 ? byLetter : options.findIndex((o) => o.toLowerCase() === a.toLowerCase());
    } else if (typeof ans === "number" && Number.isInteger(ans)) {
      correct = ans;
    }
    if (correct < 0 || correct >= options.length) {
      errors.push(`Question ${n}: "answer" must be a letter A–${LETTERS[options.length - 1]} that matches an option.`);
      return;
    }

    questions.push({ question, options, correct_index: correct, explanation: clean(q.explanation) || null });
  });

  if (errors.length) return { ok: false, errors: errors.slice(0, 12) };

  if (questions.length >= 6) {
    const counts = new Map<number, number>();
    questions.forEach((q) => counts.set(q.correct_index, (counts.get(q.correct_index) ?? 0) + 1));
    const top = Math.max(...counts.values());
    if (top / questions.length > 0.6) {
      warnings.push("Most correct answers sit on the same letter — students may notice. Consider asking Claude to shuffle.");
    }
  }

  return {
    ok: true,
    warnings,
    data: {
      title: clean(obj.title),
      description: clean(obj.description) || null,
      source: clean(obj.source) || null,
      questions,
    },
  };
}

export type Difficulty = "easy" | "mixed" | "hard";

/** The prompt the teacher copies into Claude together with the textbook lesson. */
export function buildHomeworkPrompt(opts: { count: number; difficulty: Difficulty }): string {
  const count = Math.min(Math.max(Math.round(opts.count) || 10, 1), MAX_QUESTIONS);
  const level =
    opts.difficulty === "easy"
      ? "mostly easy (recall and recognition)"
      : opts.difficulty === "hard"
      ? "mostly hard (application, comparison, and what-would-happen reasoning)"
      : "a mix of easy, medium and hard";

  return `You are helping a computing teacher turn a textbook lesson into a multiple-choice homework for students.

TASK
Write ${count} multiple-choice questions, ${level}, based ONLY on the lesson text at the bottom of this message.

OUTPUT FORMAT
Reply with ONE valid JSON object and nothing else: no introduction, no explanation, no markdown, no code fences.
Use straight double quotes, no trailing commas, no comments. Escape any double quote inside text as \\" and write line breaks as \\n.
Use exactly this structure:

{
  "title": "Lesson 3-1: Overall Structure of Web Applications",
  "source": "IT & AI textbook, Lesson 3-1",
  "questions": [
    {
      "question": "Which layer of a web application stores the data permanently?",
      "options": ["Presentation layer", "Application layer", "Data layer", "Network layer"],
      "answer": "C",
      "explanation": "The data layer (the database) is responsible for storing data permanently."
    }
  ]
}

QUESTION RULES
- Exactly 4 options per question and exactly one correct option.
- "answer" is the letter of the correct option: "A", "B", "C" or "D".
- Spread the correct answers roughly evenly across A, B, C and D. Do not favour one letter.
- Never use "all of the above", "none of the above" or "both A and B".
- Wrong options must be plausible and similar in length and style to the correct one.
- Test understanding (why, how, which, what would happen), not page numbers or trivia. Include a few application questions.
- Every question must make sense on its own and be answerable from the lesson alone.
- If a question contains code, put it inside the "question" text with \\n for line breaks.
- Write in the same language as the lesson.
- "explanation" is 1-2 short sentences saying why the answer is correct.
- "title" is short and names the lesson; "source" names the textbook and lesson.

LESSON TEXT (paste or attach it below this line):
`;
}
