import { NavItem, SiteStat } from "@/lib/types";

export const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Dashboards" },
];

export const heroStats: SiteStat[] = [
  { value: "4 core programs", label: "Structured growth tracks" },
  { value: "2 dashboard roles", label: "Admin and partner visibility" },
  { value: "1 CRM workspace", label: "Lead capture and follow-up" },
];

export const siteContent = {
  title: "Coach Jayson Dela Cruz",
  eyebrow: "JDC Original",
  headline: "Start your breakthrough today.",
  subheadline:
    "A modern coaching platform for growth, accountability, and real-world progress for OFWs, employees, and first-time entrepreneurs.",
  primaryCta: { href: "/contact", label: "Book an Inquiry" },
  secondaryCta: { href: "/programs", label: "Explore Programs" },
  mentorHeading: "Coach Jayson Dela Cruz has guided thousands of Filipinos to rise.",
  mentorBody:
    "From mindset renewal to business activation, the Coach JDC platform is designed to create real momentum through mentorship, practical systems, and community support.",
  frameworkHeading: "The Six Non-Negotiables",
  frameworkBody:
    "A disciplined approach to mindset, consistency, emotional strength, and execution that underpins the broader JDC coaching philosophy.",
  communityBullets: [
    "Mentorship sessions and guided support",
    "Access to the JDC community and program pathways",
    "Frameworks, tools, and action plans for growth",
    "Partner-ready lead visibility through a simple CRM dashboard",
  ],
  faq: [
    {
      question: "Who is the JDC community for?",
      answer:
        "It is designed for OFWs, employees, beginners, and aspiring entrepreneurs who want structure, mentorship, and a proven growth framework.",
    },
    {
      question: "What makes Coach Jayson Dela Cruz different?",
      answer:
        "The system combines mindset coaching, practical business guidance, accountability, and a strong community-oriented approach.",
    },
    {
      question: "How will leads be managed?",
      answer:
        "Every inquiry can be captured into a CRM workflow with lead details, tags, address context, and role-based dashboard access for admins and partners.",
    },
  ],
};
