import type { Student } from "@/types/arena";

const names = [
  "Riya Kulkarni", "Arjun Mehta", "Kavya Iyer", "Dev Malhotra", "Nisha Rao",
  "Harsh Gupta", "Meera Shah", "Ayaan Khan", "Tara Joshi", "Rohan Sen",
  "Ishita Nair", "Kabir Bose", "Anaya Singh", "Vivaan Jain", "Sara Pillai",
  "Neel Patil", "Diya Menon", "Aditya Roy", "Mira Das", "Yash Verma",
  "Avni Kapoor", "Rehan Ali", "Saanvi Rao", "Atharv Desai", "Zoya Sheikh",
];

export const students: Student[] = names.map((name, index) => ({
  id: `student-${index + 1}`,
  institute_id: index < 18 ? "inst-yzi" : "inst-bloom",
  batch_id: index < 12 ? "batch-cse" : index < 18 ? "batch-mba" : "batch-bloom",
  auth_user_id: `auth-student-${index + 1}`,
  email: `${name.toLowerCase().replaceAll(" ", ".")}@example.edu`,
  name,
  photo_url: null,
  status: "active",
  consent_at: "2026-08-20",
  created_at: "2026-08-14",
}));
