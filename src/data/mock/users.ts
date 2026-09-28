import type { InstituteUser } from "@/types/arena";

export const instituteUsers: InstituteUser[] = [
  { id: "iu-1", institute_id: "inst-yzi", auth_user_id: "auth-iu-1", email: "placement@pioneer.edu", name: "Meera Krishnan", role: "admin", status: "active", created_at: "2026-06-01" },
  { id: "iu-2", institute_id: "inst-yzi", auth_user_id: "auth-iu-2", email: "faculty@pioneer.edu", name: "Sanjay Bhatt", role: "viewer", status: "active", created_at: "2026-06-05" },
  { id: "iu-3", institute_id: "inst-bloom", auth_user_id: "auth-iu-3", email: "careers@bloom.edu", name: "Alisha Fernandes", role: "admin", status: "active", created_at: "2026-07-14" },
  { id: "iu-4", institute_id: "inst-bloom", auth_user_id: "auth-iu-4", email: "observer@bloom.edu", name: "Vikram Sethi", role: "viewer", status: "active", created_at: "2026-07-20" },
];
