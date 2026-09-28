export type RoundKey = "screening" | "hr_bp" | "functional" | "ceo";
export type StudentState =
  | "not_started"
  | "mid_round"
  | "retried"
  | "disconnected"
  | "ceo_locked"
  | "offer_accepted"
  | "restart_pending";

export interface Institute {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  status: "active" | "paused";
  pass_bar: number;
  ceo_threshold: number;
  created_at: string;
}

export interface Batch {
  id: string;
  institute_id: string;
  name: string;
  program: string;
  year: number;
  invite_code: string;
  created_at: string;
}

export interface Student {
  id: string;
  institute_id: string;
  batch_id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  photo_url: string | null;
  status: "invited" | "active" | "archived";
  consent_at: string | null;
  created_at: string;
  demo_state: StudentState;
  profile_strength: number;
  current_round: RoundKey | null;
  last_score: number | null;
  verdict: "Passed" | "Needs improvement" | "Not started";
  weak_area: string;
}

export interface CompanyProfile {
  id: string;
  source: "web" | "manual" | "yzi_dashboard";
  name: string;
  sector: string;
  city: string;
  size: string;
  role: string;
  ctc_min: number;
  ctc_max: number;
  tier: string;
  requirements: string[];
  match: number;
}

export interface RoundResult {
  round: RoundKey;
  score: number | null;
  progress_pct: number;
  verdict: "passed" | "needs_improvement" | "pending";
  takeaway: string;
  resume_used: boolean;
  try_no: 1 | 2;
}

export interface Resource {
  id: string;
  gap_type: "All" | "Skill gap" | "Communication" | "Expectation" | "Aptitude";
  title: string;
  source: string;
  length: string;
  is_paid: boolean;
}

export interface CurrentUser {
  role: "student" | "institute";
  student_id?: string;
  institute_id: string;
}