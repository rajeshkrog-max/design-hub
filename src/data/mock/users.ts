import type { InstituteUser } from "@/types/arena";

// One login per institute. The demo has only Pioneer's.
export const instituteUsers: InstituteUser[] = [
  { id: "iu-1", institute_id: "inst-yzi", auth_user_id: "auth-iu-1", email: "placement@pioneer.edu", name: "Meera Krishnan", role: "admin", status: "active", created_at: "2026-06-01" },
];
