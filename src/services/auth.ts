// Auth backend contract. Front end only for now: every function is a stub that accepts any
// input and returns a mock value. Replace each body with the real backend call later.
import { getStore, persist } from "@/data/mock/store";
import type { PlanKey, SessionUser } from "@/types/arena";

/** Demo identities the stubs sign in as. */
const DEMO_INSTITUTE_STUDENT: SessionUser = { role: "student", auth_user_id: "auth-student-1", student_id: "student-1", institute_id: "inst-yzi" };
const DEMO_INDEPENDENT: SessionUser = { role: "student", auth_user_id: "auth-student-ind-1", student_id: "student-ind-1", institute_id: null };
const DEMO_INSTITUTE: SessionUser = { role: "institute", auth_user_id: "auth-iu-1", institute_user_id: "iu-1", institute_id: "inst-yzi" };

export type StudentKind = "institute" | "independent";

/** What the student typed on the login or sign-up screen. Name and email only on sign-up. */
export type OtpRequest =
  | { kind: "institute"; institute_code: string; whatsapp: string; name?: string; email?: string }
  | { kind: "independent"; email: string; whatsapp: string; name?: string };

/** Send a WhatsApp OTP for login or sign-up. */
export function requestOtp(request: OtpRequest): { sent: true } {
  // TODO backend: validate the institute code / account, create the student on sign-up, send the OTP on WhatsApp
  void request;
  return { sent: true };
}

/** Verify the OTP and start a session. Mock: any 6 digits signs in as the demo student. */
export function verifyOtp(request: OtpRequest, code: string): SessionUser {
  // TODO backend: verify the code for request.whatsapp and return the real session
  void code;
  return request.kind === "institute" ? DEMO_INSTITUTE_STUDENT : DEMO_INDEPENDENT;
}

/** Institute login: one account per institute. Mock: any input signs in as Pioneer. */
export function loginInstitute(email: string, password: string): SessionUser {
  // TODO backend: check the institute's email and password and return the real session
  void email;
  void password;
  return DEMO_INSTITUTE;
}

/** Independent candidate picks a plan after sign-up. Mock: no payment, just records the plan. */
export function choosePlan(user: SessionUser, plan: PlanKey): { plan: PlanKey } {
  // TODO backend: start the subscription (payment) and set the plan on the student
  const student = getStore().students.find((s) => s.id === user.student_id);
  if (student) {
    student.plan = plan;
    persist();
  }
  return { plan };
}

/** End the session. */
export function logout(): void {
  // TODO backend: revoke the session token
}
