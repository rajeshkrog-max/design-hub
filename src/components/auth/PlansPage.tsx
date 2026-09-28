import { useNavigate } from "@tanstack/react-router";
import { choosePlan } from "@/services/auth";
import { useSession } from "@/services/session";
import { AuthFrame, PlanCards } from "./shared";

/** Shown to independent candidates right after sign-up. Mock: no payment is taken. */
export function PlansPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  return (
    <AuthFrame title="Choose your plan." copy="Each full attempt through all four rounds uses one interview credit.">
      <PlanCards
        onChoose={(plan) => {
          if (user) choosePlan(user, plan);
          navigate({ to: "/candidate" });
        }}
      />
    </AuthFrame>
  );
}
