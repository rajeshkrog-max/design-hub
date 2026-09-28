import type { ProfileTierName, StudentProfile } from "@/types/arena";
import { instituteStudents } from "./students";

const cities = ["Bengaluru", "Pune", "Hyderabad", "Mumbai", "Delhi", "Chennai"];
const techPool = ["Java", "Python", "SQL", "React", "Node.js", "DSA", "Excel", "Power BI", "C++", "AWS"];
const toolPool = ["Git", "Figma", "Jira", "Postman", "Tableau", "Docker"];
const softPool = ["Communication", "Teamwork", "Leadership", "Time management", "Presentation"];
const roles = ["Software engineer", "Business analyst", "Data analyst", "Marketing associate", "Backend engineer"];

function tierFor(index: number): ProfileTierName {
  if (index % 5 === 0) return "Strong";
  if (index % 2 === 0) return "Good";
  return "Starter";
}

function scoreFor(tier: ProfileTierName, index: number): number {
  const base = tier === "Strong" ? 82 : tier === "Good" ? 60 : 38;
  return Math.min(97, base + ((index * 3) % 12));
}

export const profiles: StudentProfile[] = instituteStudents.map((student, index) => {
  const tier = tierFor(index);
  const sparse = index % 4 === 3; // some profiles leave optional sections blank
  const incomplete = index === 0; // student-1: profile incomplete, not started
  const tech = [0, 1, 2].map((k) => ({
    name: techPool[(index + k) % techPool.length]!,
    level: (["basic", "intermediate", "advanced"] as const)[(index + k) % 3]!,
  }));
  return {
    student_id: student.id,
    institute_id: student.institute_id,
    personal: incomplete
      ? null
      : {
          name: student.name,
          email: student.email,
          phone: student.phone,
          city: cities[index % cities.length]!,
          linkedin: `linkedin.com/in/${student.name.toLowerCase().replaceAll(" ", "-")}`,
          photo_url: null,
        },
    education: incomplete
      ? null
      : {
          degree: student.institute_id === "inst-bloom" ? "PGDM" : index < 12 ? "B.Tech" : "MBA",
          branch: student.institute_id === "inst-bloom" ? "Management" : index < 12 ? "Computer Science" : "Marketing",
          college: student.institute_id === "inst-bloom" ? "Bloom School of Business" : "Pioneer Institute of Technology",
          grad_year: student.institute_id === "inst-bloom" ? 2027 : 2026,
          cgpa: (6.4 + ((index * 7) % 30) / 10).toFixed(1),
          ...(sparse
            ? {}
            : {
                class_xii: `${78 + ((index * 5) % 20)}% · CBSE`,
                class_x: `${80 + ((index * 3) % 18)}% · CBSE`,
              }),
          ...(index % 6 === 5 ? { gap: "1 year preparation gap" } : {}),
        },
    skills: incomplete
      ? null
      : {
          technical: tech,
          tools: [0, 1].map((k) => ({
            name: toolPool[(index + k) % toolPool.length]!,
            level: (["basic", "intermediate"] as const)[k]!,
          })),
          soft: [softPool[index % softPool.length]!, softPool[(index + 2) % softPool.length]!],
        },
    preferences: incomplete
      ? null
      : {
          role: roles[index % roles.length]!,
          cities: [cities[index % cities.length]!, cities[(index + 3) % cities.length]!],
          expected_ctc: tier === "Strong" ? "7–9 LPA" : tier === "Good" ? "4.5–6 LPA" : "3–4 LPA",
          relocate: index % 3 !== 0,
          available_from: "2026-07-01",
        },
    summary: incomplete
      ? null
      : `${student.name.split(" ")[0]} is a ${tier.toLowerCase()}-profile candidate focused on ${roles[index % roles.length]!.toLowerCase()} roles, with ${tier === "Starter" ? "foundational" : "solid"} skills and clear growth areas.`,
    experience: sparse || incomplete
      ? []
      : [
          {
            company: ["Zentro", "PixelWorks", "DataBridge", "FinEdge"][index % 4]!,
            role: "Intern",
            dates: "May–Jul 2025",
            type: "Internship",
            achievements: "Shipped a small feature used by the internal team.",
          },
        ],
    projects: sparse || incomplete
      ? []
      : [
          {
            title: ["Placement tracker", "Campus events app", "Stock screener", "Notes AI"][index % 4]!,
            stack: tech.map((t) => t.name).join(", "),
            role: "Solo builder",
            impact: "Used by 200+ classmates.",
            link: "github.com/example",
          },
        ],
    certifications: sparse || incomplete
      ? []
      : [{ name: "SQL Fundamentals", issuer: "Coursera", year: "2025", link: "coursera.org/verify/example" }],
    achievements: sparse || incomplete ? [] : ["Hackathon finalist 2025", "LeetCode 300+ problems"],
    activities: sparse || incomplete ? [] : ["Placement cell volunteer", "Tech club core member"],
    languages: sparse || incomplete ? [] : ["English", "Hindi", ["Kannada", "Marathi", "Tamil", "Bengali"][index % 4]!],
    strength_score: incomplete ? 22 : scoreFor(tier, index),
    strength_tier: tier,
    required_complete: !incomplete,
    cv_file_key: incomplete ? null : `cv/${student.id}.pdf`,
    cv_extracted: !incomplete,
    updated_at: "2026-09-10",
  };
});
