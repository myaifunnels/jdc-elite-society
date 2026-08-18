import { Program } from "@/lib/types";

export const programs: Program[] = [
  {
    slug: "mindset-reset",
    title: "Mindset Reset",
    shortDescription: "Break limiting beliefs, rebuild confidence, and start thinking like a winner.",
    audience: "OFWs, employees, and beginners who want to rebuild clarity and confidence.",
    transformation: "Move from fear and hesitation into confidence, discipline, and daily action.",
    benefits: [
      "Stronger self-belief and emotional resilience",
      "Clear daily routines and accountability",
      "A practical framework for personal transformation",
    ],
    modules: [
      "Identity and confidence reset",
      "Daily habits for consistency",
      "Mindset tools for overcoming setbacks",
    ],
    faqs: [
      {
        question: "Who is this for?",
        answer:
          "It is designed for people who feel stuck, overwhelmed, or disconnected from their goals and want a disciplined reset.",
      },
      {
        question: "What is the main outcome?",
        answer:
          "The program helps participants regain focus, confidence, and the habits needed to take action consistently.",
      },
    ],
    ctaLabel: "Start Your Reset",
  },
  {
    slug: "business-kickstart",
    title: "Business Kickstart",
    shortDescription: "Step-by-step guidance for starting and growing a business with practical coaching.",
    audience: "Aspiring entrepreneurs and first-time business builders.",
    transformation: "Turn business ideas into a practical launch plan with guidance and accountability.",
    benefits: [
      "A simple launch roadmap",
      "Coaching on positioning and execution",
      "Momentum from idea to action",
    ],
    modules: [
      "Business idea validation",
      "Simple offer creation",
      "Execution planning and accountability",
    ],
    faqs: [
      {
        question: "Do I need prior business experience?",
        answer:
          "No. The program is built for beginners who need structure, guidance, and practical next steps.",
      },
      {
        question: "What will I leave with?",
        answer:
          "You should leave with a clearer business direction, action plan, and stronger confidence to launch.",
      },
    ],
    ctaLabel: "Build My Business Plan",
  },
  {
    slug: "life-leadership-mentoring",
    title: "Life & Leadership Mentoring",
    shortDescription: "Develop discipline, emotional strength, and leadership skills to win in life and work.",
    audience: "Professionals, leaders, and growth-minded individuals.",
    transformation: "Grow into a more disciplined, steady, and influential leader in life and business.",
    benefits: [
      "Leadership development with values-driven coaching",
      "Stronger decision-making and discipline",
      "Personal growth with mentorship and reflection",
    ],
    modules: [
      "Leadership foundations",
      "Communication and emotional strength",
      "Decision-making with discipline",
    ],
    faqs: [
      {
        question: "Is this only for managers?",
        answer:
          "No. Anyone who wants to lead themselves better or influence others more effectively can benefit.",
      },
      {
        question: "How is it different from business coaching?",
        answer:
          "This program emphasizes leadership, character, emotional strength, and sustainable personal growth.",
      },
    ],
    ctaLabel: "Grow as a Leader",
  },
  {
    slug: "ofw-retirement-blueprint",
    title: "OFW Retirement Blueprint",
    shortDescription: "A roadmap for OFWs who want to retire with direction, stability, and business readiness.",
    audience: "OFWs preparing to transition toward long-term financial and lifestyle freedom.",
    transformation: "Move from uncertainty about the future into a concrete retirement and transition plan.",
    benefits: [
      "Structured planning for your next chapter",
      "Coaching around transition, income, and purpose",
      "Business and mindset support for post-OFW life",
    ],
    modules: [
      "Transition planning and mindset",
      "Retirement readiness mapping",
      "Business and income preparation",
    ],
    faqs: [
      {
        question: "Is this only about retirement money?",
        answer:
          "No. It also focuses on identity, business readiness, and planning for a meaningful transition back home.",
      },
      {
        question: "Who benefits most?",
        answer:
          "OFWs who want a clearer strategy for leaving overseas work and building a stable future.",
      },
    ],
    ctaLabel: "Plan My Transition",
  },
];

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
