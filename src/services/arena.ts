import { batches, institutes, students } from "@/data/mock/arena";
import type { CurrentUser } from "@/types/arena";

export function getInstituteWorkspace(user: CurrentUser) {
  if (user.role !== "institute") throw new Error("Institute access required");
  const institute = institutes.find((item) => item.id === user.institute_id);
  if (!institute) throw new Error("Institute not found");
  return {
    institute,
    batches: batches.filter((item) => item.institute_id === user.institute_id),
    students: students.filter((item) => item.institute_id === user.institute_id),
  };
}

export function getStudentWorkspace(user: CurrentUser) {
  if (user.role !== "student" || !user.student_id) throw new Error("Student access required");
  const student = students.find((item) => item.id === user.student_id && item.institute_id === user.institute_id);
  if (!student) throw new Error("Student not found");
  return student;
}