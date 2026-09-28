import type { AptitudeAttempt, AptitudeQuestion } from "@/types/arena";
import { demoSession, rounds } from "./sessions";

type Q = [topic: string, prompt: string, options: string[], correct: number];

const bank: Q[] = [
  ["Quant", "A train covers 240 km in 3 hours. What is its average speed?", ["60 km/h", "70 km/h", "80 km/h", "90 km/h"], 2],
  ["Quant", "If 20% of a number is 45, what is the number?", ["200", "225", "250", "180"], 1],
  ["Quant", "A server handles 1,200 requests a minute. How many in 45 seconds?", ["800", "900", "960", "1,000"], 1],
  ["Quant", "A laptop costs ₹48,000 after a 20% discount. What was the list price?", ["₹57,600", "₹60,000", "₹58,000", "₹62,400"], 1],
  ["Quant", "Two developers finish a task in 6 and 12 days alone. How long together?", ["3 days", "4 days", "5 days", "9 days"], 1],
  ["Logical", "Find the next term: 3, 6, 11, 18, ?", ["25", "27", "29", "24"], 1],
  ["Logical", "All engineers are graduates. Some graduates are artists. Which follows?", ["All engineers are artists", "Some engineers may be artists", "No engineer is an artist", "All artists are engineers"], 1],
  ["Logical", "If CODE is written DPEF, how is BUGS written?", ["CVHT", "CVGT", "BVHT", "CUHT"], 0],
  ["Logical", "A deploy runs every 5 hours from 9 am Monday. When is the 6th run?", ["10 am Tuesday", "9 am Tuesday", "8 pm Monday", "2 pm Tuesday"], 0],
  ["SQL", "Which JOIN returns every row from the left table, even without a match?", ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"], 1],
  ["SQL", "Which clause filters rows after GROUP BY?", ["WHERE", "HAVING", "ORDER BY", "LIMIT"], 1],
  ["SQL", "What does COUNT(*) count when some columns are NULL?", ["Only non-null rows", "All rows", "Distinct rows", "It errors"], 1],
  ["Verbal", "Pick the word closest in meaning to 'robust'.", ["Fragile", "Sturdy", "Quick", "Complex"], 1],
  ["Verbal", "Choose the correct sentence.", ["Each of the teams have a lead", "Each of the teams has a lead", "Each teams has a lead", "Each of team have a lead"], 1],
  ["Verbal", "'Scalable' in a job description most nearly means:", ["Easy to read", "Able to grow with demand", "Cheap to run", "Secure by default"], 1],
];

/** 15 MCQs, 20 minutes. The backend generates a company-specific set later. */
export const aptitudeQuestions: AptitudeQuestion[] = bank.map(([topic, prompt, options, correct], i) => ({
  id: `q${i + 1}`,
  kind: "mcq",
  topic,
  prompt,
  options,
  correct,
}));

// Riya's submitted aptitude: 11 of 15 correct (wrong on q4, q8, q10, q12).
const riyaAptitude = rounds.find((r) => r.session_id === demoSession.id && r.round === "aptitude")!;
const wrong = new Set(["q4", "q8", "q10", "q12"]);

export const aptitudeAttempts: AptitudeAttempt[] = [
  {
    id: "apt-riya",
    institute_id: riyaAptitude.institute_id,
    round_id: riyaAptitude.id,
    questions: aptitudeQuestions,
    answers: Object.fromEntries(aptitudeQuestions.map((q) => [q.id, wrong.has(q.id) ? ((q.correct ?? 0) + 1) % 4 : q.correct ?? 0])),
    mcq_score: 11,
    written_feedback: null,
    submitted_at: "2026-09-11T10:32:00Z",
  },
];
