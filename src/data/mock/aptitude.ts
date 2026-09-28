import type { AptitudeAttempt, AptitudeQuestion } from "@/types/arena";

export const aptitudeQuestions: AptitudeQuestion[] = [
  { id: "q1", kind: "mcq", topic: "Quant", prompt: "A train covers 240 km in 3 hours. What is its average speed?", options: ["60 km/h", "70 km/h", "80 km/h", "90 km/h"], correct: 2 },
  { id: "q2", kind: "mcq", topic: "Quant", prompt: "If 20% of a number is 45, what is the number?", options: ["200", "225", "250", "180"], correct: 1 },
  { id: "q3", kind: "mcq", topic: "Logical", prompt: "Find the next term: 3, 6, 11, 18, ?", options: ["25", "27", "29", "24"], correct: 1 },
  { id: "q4", kind: "mcq", topic: "Logical", prompt: "All engineers are graduates. Some graduates are artists. Which follows?", options: ["All engineers are artists", "Some engineers may be artists", "No engineer is an artist", "All artists are engineers"], correct: 1 },
  { id: "q5", kind: "mcq", topic: "SQL", prompt: "Which JOIN returns only rows with matches in both tables?", options: ["LEFT JOIN", "INNER JOIN", "FULL JOIN", "CROSS JOIN"], correct: 1 },
  { id: "q6", kind: "mcq", topic: "SQL", prompt: "Which clause filters grouped rows?", options: ["WHERE", "ORDER BY", "HAVING", "LIMIT"], correct: 2 },
  { id: "q7", kind: "mcq", topic: "Verbal", prompt: "Choose the synonym of 'candid'.", options: ["Secretive", "Frank", "Rude", "Clever"], correct: 1 },
  { id: "q8", kind: "mcq", topic: "Verbal", prompt: "Choose the correctly spelt word.", options: ["Occurence", "Occurrence", "Ocurrence", "Occurrance"], correct: 1 },
  { id: "q9", kind: "written", topic: "Situational", prompt: "Describe a time you missed a deadline. What did you do, and what did you change afterwards?" },
  { id: "q10", kind: "written", topic: "Role-specific", prompt: "Explain a project you are proud of to a non-technical interviewer in 5–6 sentences." },
];

export const aptitudeAttempts: AptitudeAttempt[] = [];
