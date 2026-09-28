import { createFileRoute } from "@tanstack/react-router";
import { PlansPage } from "@/components/auth/PlansPage";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Plans — Sera Interview Arena" },
      { name: "description", content: "Choose or upgrade your individual Sera plan." },
      { property: "og:title", content: "Plans — Sera Interview Arena" },
      { property: "og:description", content: "Choose or upgrade your individual Sera plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlansPage,
});
