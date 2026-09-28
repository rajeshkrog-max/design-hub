import { INSTITUTE_CREDITS } from "@/lib/rules";
import type { Student } from "@/types/arena";

const names = [
  "Riya Kulkarni", "Arjun Mehta", "Kavya Iyer", "Dev Malhotra", "Nisha Rao",
  "Harsh Gupta", "Meera Shah", "Ayaan Khan", "Tara Joshi", "Rohan Sen",
  "Ishita Nair", "Kabir Bose", "Anaya Singh", "Vivaan Jain", "Sara Pillai",
  "Neel Patil", "Diya Menon", "Aditya Roy", "Mira Das", "Yash Verma",
  "Avni Kapoor", "Rehan Ali", "Saanvi Rao", "Atharv Desai", "Zoya Sheikh",
];

const emailFor = (name: string) => `${name.toLowerCase().replaceAll(" ", ".")}@example.edu`;
const phoneFor = (index: number) => `+91 98${String(10000000 + index * 137913).slice(0, 8)}`;

/** Seeded institute students (indexes 0–24 are referenced by profiles and sessions).
 *  student-1 (Riya Kulkarni, Pioneer) is the demo institute student. */
export const instituteStudents: Student[] = names.map((name, index) => ({
  id: `student-${index + 1}`,
  account_type: "institute",
  institute_id: index < 18 ? "inst-yzi" : "inst-bloom",
  batch_id: index < 12 ? "batch-cse" : index < 18 ? "batch-mba" : "batch-bloom",
  auth_user_id: `auth-student-${index + 1}`,
  email: emailFor(name),
  phone: phoneFor(index),
  name,
  photo_url: null,
  status: "active",
  credits_total: INSTITUTE_CREDITS,
  // students 3–22 (indexes 2–21) have used one attempt in the seeded sessions
  credits_used: index >= 2 && index <= 21 ? 1 : 0,
  plan: null,
  consent_at: "2026-08-20",
  created_at: "2026-08-14",
}));

/** The demo independent candidate (self sign-up, Standard plan). */
export const demoIndependent: Student = {
  id: "student-ind-1",
  account_type: "independent",
  institute_id: null,
  batch_id: null,
  auth_user_id: "auth-student-ind-1",
  email: "aarav.sharma@example.com",
  phone: "+91 96000 22001",
  name: "Aarav Sharma",
  photo_url: null,
  status: "active",
  credits_total: 3,
  credits_used: 0,
  plan: "standard",
  consent_at: "2026-09-10",
  created_at: "2026-09-10",
};

export const students: Student[] = [...instituteStudents, demoIndependent];
