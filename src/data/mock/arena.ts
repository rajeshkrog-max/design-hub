import type { Batch, CompanyProfile, Institute, Resource, RoundResult, Student } from "@/types/arena";

export const institutes: Institute[] = [
  { id: "inst-yzi", name: "Pioneer Institute of Technology", slug: "pioneer-tech", logo_url: null, plan: "campus", status: "active", pass_bar: 60, ceo_threshold: 65, created_at: "2026-06-01" },
  { id: "inst-bloom", name: "Bloom School of Business", slug: "bloom-business", logo_url: null, plan: "pilot", status: "active", pass_bar: 60, ceo_threshold: 65, created_at: "2026-07-14" },
];

export const batches: Batch[] = [
  { id: "batch-cse", institute_id: "inst-yzi", name: "CSE 2026", program: "B.Tech Computer Science", year: 2026, invite_code: "PIT-CSE26", created_at: "2026-06-03" },
  { id: "batch-mba", institute_id: "inst-yzi", name: "MBA 2026", program: "MBA", year: 2026, invite_code: "PIT-MBA26", created_at: "2026-06-04" },
  { id: "batch-bloom", institute_id: "inst-bloom", name: "PGDM 2027", program: "PGDM", year: 2027, invite_code: "BSB-PG27", created_at: "2026-07-18" },
];

const states: Student["demo_state"][] = ["offer_accepted", "mid_round", "ceo_locked", "restart_pending", "retried", "disconnected", "not_started"];
const names = ["Riya Kulkarni", "Arjun Mehta", "Kavya Iyer", "Dev Malhotra", "Nisha Rao", "Harsh Gupta", "Meera Shah", "Ayaan Khan", "Tara Joshi", "Rohan Sen", "Ishita Nair", "Kabir Bose", "Anaya Singh", "Vivaan Jain", "Sara Pillai", "Neel Patil", "Diya Menon", "Aditya Roy", "Mira Das", "Yash Verma", "Avni Kapoor", "Rehan Ali", "Saanvi Rao", "Atharv Desai", "Zoya Sheikh"];

export const students: Student[] = names.map((name, index) => ({
  id: `student-${index + 1}`,
  institute_id: index < 18 ? "inst-yzi" : "inst-bloom",
  batch_id: index < 12 ? "batch-cse" : index < 18 ? "batch-mba" : "batch-bloom",
  auth_user_id: index % 7 === 6 ? null : `auth-${index + 1}`,
  email: `${name.toLowerCase().replaceAll(" ", ".")}@example.edu`,
  name,
  photo_url: null,
  status: index % 7 === 6 ? "invited" : "active",
  consent_at: index % 7 === 6 ? null : "2026-08-20",
  created_at: "2026-08-14",
  demo_state: states[index % states.length] ?? "not_started",
  profile_strength: 48 + ((index * 7) % 49),
  current_round: index % 7 === 6 ? null : ((["screening", "hr_bp", "functional", "ceo"] as const)[index % 4] ?? "screening"),
  last_score: index % 7 === 6 ? null : 54 + ((index * 5) % 39),
  verdict: index % 7 === 6 ? "Not started" : index % 4 === 2 ? "Needs improvement" : "Passed",
  weak_area: ["SQL depth", "Answer structure", "Salary alignment", "Aptitude"][index % 4] ?? "Communication",
}));

export const companies: CompanyProfile[] = [
  { id: "co-1", source: "web", name: "Northwind Systems", sector: "Product technology", city: "Bengaluru", size: "MNC", role: "Software engineer", ctc_min: 4.5, ctc_max: 6, tier: "Good", requirements: ["Java", "DSA", "REST APIs"], match: 82 },
  { id: "co-2", source: "web", name: "Kestrel Labs", sector: "SaaS", city: "Pune", size: "Series B startup", role: "Backend engineer", ctc_min: 5, ctc_max: 7, tier: "Good", requirements: ["Node.js", "SQL", "Ownership"], match: 76 },
  { id: "co-3", source: "web", name: "Meridian Power", sector: "Energy", city: "Delhi", size: "Central PSU", role: "Graduate engineer trainee", ctc_min: 4, ctc_max: 5.5, tier: "Good", requirements: ["Aptitude", "Networks", "Protocol"], match: 64 },
];

export const roundResults: RoundResult[] = [
  { round: "screening", score: 71, progress_pct: 100, verdict: "passed", takeaway: "Clear examples, stronger close needed.", resume_used: false, try_no: 1 },
  { round: "hr_bp", score: 64, progress_pct: 100, verdict: "passed", takeaway: "Good culture fit; salary ask was high.", resume_used: false, try_no: 1 },
  { round: "functional", score: 58, progress_pct: 100, verdict: "needs_improvement", takeaway: "Practise SQL joins and trade-offs.", resume_used: false, try_no: 1 },
  { round: "ceo", score: null, progress_pct: 0, verdict: "pending", takeaway: "Needs an average of 65 to unlock.", resume_used: false, try_no: 1 },
];

export const resources: Resource[] = [
  { id: "r1", gap_type: "Skill gap", title: "SQL joins explained visually", source: "freeCodeCamp", length: "18 min", is_paid: false },
  { id: "r2", gap_type: "Skill gap", title: "20 SQL interview problems", source: "YouTube", length: "Playlist", is_paid: false },
  { id: "r3", gap_type: "Communication", title: "Build answers with STAR", source: "YZI Works", length: "8 min", is_paid: false },
  { id: "r4", gap_type: "Expectation", title: "Fresher salary bands 2026", source: "Career guide", length: "6 min", is_paid: false },
  { id: "r5", gap_type: "Aptitude", title: "Quant aptitude crash course", source: "NPTEL", length: "Playlist", is_paid: false },
  { id: "r6", gap_type: "Communication", title: "Executive speaking lab", source: "YZI Academy", length: "2 hours", is_paid: true },
];