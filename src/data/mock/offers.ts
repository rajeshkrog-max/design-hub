import type { Offer, RestartRequest } from "@/types/arena";
import { sessions } from "./sessions";

const byIndex = (i: number) => sessions[i]!;

// All seeded sessions belong to institute students, so institute_id is set.
// Session order in `sessions` matches student indexes: 2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21
export const offers: Offer[] = [
  { id: "offer-1", institute_id: byIndex(8).institute_id, session_id: byIndex(8).id, role: "Software engineer", ctc: "6.5 LPA", joining: "Jul 2027", decision: "pending", decided_at: null },
  { id: "offer-2", institute_id: byIndex(9).institute_id, session_id: byIndex(9).id, role: "Software engineer", ctc: "8 LPA", joining: "Jul 2027", decision: "accepted", decided_at: "2026-09-15" },
  { id: "offer-3", institute_id: byIndex(10).institute_id, session_id: byIndex(10).id, role: "Backend engineer", ctc: "6 LPA", joining: "Aug 2027", decision: "declined", decided_at: "2026-09-15" },
  { id: "offer-4", institute_id: byIndex(15).institute_id, session_id: byIndex(15).id, role: "Business analyst", ctc: "5.5 LPA", joining: "Jul 2027", decision: "accepted", decided_at: "2026-09-16" },
  { id: "offer-5", institute_id: byIndex(18).institute_id, session_id: byIndex(18).id, role: "Marketing associate", ctc: "5 LPA", joining: "Jul 2027", decision: "accepted", decided_at: "2026-09-17" },
];

export const restartRequests: RestartRequest[] = [
  { id: "rr-1", institute_id: byIndex(11).institute_id!, student_id: byIndex(11).student_id, session_id: byIndex(11).id, reason: "I was unwell during the functional round and want a fair second attempt.", status: "pending", decided_by: null, decided_at: null, created_at: "2026-09-20" },
  { id: "rr-2", institute_id: byIndex(12).institute_id!, student_id: byIndex(12).student_id, session_id: byIndex(12).id, reason: "Network issues disrupted two rounds.", status: "approved", decided_by: "iu-1", decided_at: "2026-09-21", created_at: "2026-09-19" },
];
