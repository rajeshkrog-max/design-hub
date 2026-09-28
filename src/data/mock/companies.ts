import type { CompanyProfile, ProfileTierName } from "@/types/arena";

function co(
  id: string,
  name: string,
  tier: ProfileTierName,
  sector: string,
  city: string,
  size: string,
  role: string,
  ctc_min: number,
  ctc_max: number,
  requirements: string[],
): CompanyProfile {
  return {
    id,
    source: "web",
    name,
    sector,
    sub_sector: sector,
    city,
    size,
    role,
    ctc_min,
    ctc_max,
    tier,
    jd: `${name} is hiring ${role}s in ${city}. You will work with ${requirements.slice(0, 2).join(" and ")} in a ${size.toLowerCase()} environment.`,
    requirements,
    interview_style: "Structured, example-driven",
    sources: ["careers page", "public listings"],
    is_sample: true,
    generated_at: "2026-09-01",
    expires_at: "2026-12-01",
  };
}

export const companies: CompanyProfile[] = [
  // Strong tier
  co("co-s1", "Northwind Systems", "Strong", "Product technology", "Bengaluru", "MNC", "Software engineer", 7, 10, ["Java", "DSA", "System design basics"]),
  co("co-s2", "Helio Analytics", "Strong", "Data platforms", "Hyderabad", "Series C", "Data engineer", 7.5, 9.5, ["Python", "SQL", "Pipelines"]),
  co("co-s3", "Vantage Capital Tech", "Strong", "FinTech", "Mumbai", "MNC", "Technology analyst", 8, 11, ["Aptitude", "Excel", "Communication"]),
  // Good tier
  co("co-g1", "Kestrel Labs", "Good", "SaaS", "Pune", "Series B startup", "Backend engineer", 5, 7, ["Node.js", "SQL", "Ownership"]),
  co("co-g2", "Meridian Power", "Good", "Energy", "Delhi", "Central PSU", "Graduate engineer trainee", 4, 5.5, ["Aptitude", "Networks", "Protocol"]),
  co("co-g3", "BrightCart", "Good", "E-commerce", "Bengaluru", "Mid-size", "Business analyst", 4.5, 6, ["Excel", "SQL", "Stakeholder skills"]),
  // Starter tier
  co("co-t1", "Nimbus Services", "Starter", "IT services", "Chennai", "Large services", "Trainee engineer", 2.8, 3.8, ["Basics of programming", "Aptitude"]),
  co("co-t2", "Orbit Media", "Starter", "Digital marketing", "Mumbai", "Small agency", "Marketing associate", 2.5, 3.5, ["Communication", "Social media"]),
  co("co-t3", "Greenfield Logistics", "Starter", "Logistics", "Delhi", "SME", "Operations trainee", 2.5, 3.6, ["Excel", "Coordination"]),
];
