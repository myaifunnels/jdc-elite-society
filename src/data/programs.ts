import { Program } from "@/lib/types";

export const programs: Program[] = [
  {
    slug: "mindset-reset",
    title: "Mindset Reset",
    shortDescription: "If your thinking is still the bottleneck, nothing else will stick.",
    audience: "OFWs, employees, and beginners who feel stuck, scattered, or tired of starting over.",
    transformation:
      "You stop running on mood. You get a clearer head, a daily standard, and the discipline to take the next step even when you don't feel ready.",
    benefits: [
      "An honest look at the beliefs that keep delaying you",
      "Daily routines you can keep, not a 30-day high",
      "Tools for pressure, setbacks, and the days you want to quit",
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
          "If you know what you should do and still don't do it, start here. This is for people who feel stuck, overwhelmed, or disconnected from their own goals.",
      },
      {
        question: "What is the main outcome?",
        answer:
          "You leave with a clearer head, a standard for your days, and habits that make action less optional.",
      },
    ],
    ctaLabel: "Start with Mindset Reset",
  },
  {
    slug: "business-kickstart",
    title: "Business Kickstart",
    shortDescription: "You don't need a perfect idea. You need an offer, a plan, and someone who will make you execute.",
    audience: "First-time entrepreneurs and people with an idea that has lived in a notes app too long.",
    transformation:
      "You turn a vague business idea into a simple offer, a launch plan, and weekly actions you can actually finish.",
    benefits: [
      "A launch roadmap you can follow without guessing",
      "Help naming the offer, the customer, and the next move",
      "Accountability so the business leaves the conversation and enters the calendar",
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
          "No. This is built for beginners who need structure, not more theory. We start from where you are.",
      },
      {
        question: "What will I leave with?",
        answer:
          "A clearer direction, a practical action plan, and less room to keep postponing the first real step.",
      },
    ],
    ctaLabel: "Start with Business Kickstart",
  },
  {
    slug: "life-leadership-mentoring",
    title: "Life & Leadership Mentoring",
    shortDescription: "Before you lead a business, a team, or a family, you have to lead yourself.",
    audience: "Professionals and growth-minded people who want more discipline, not another title.",
    transformation:
      "You become harder to shake: clearer decisions, stronger emotional control, and leadership that holds under pressure.",
    benefits: [
      "Leadership built on character, not performance",
      "Cleaner decisions when the pressure is on",
      "Mentorship for the person you have to be at home and at work",
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
          "No. If you want to lead yourself better — and influence the people who count on you — this is for you.",
      },
      {
        question: "How is it different from business coaching?",
        answer:
          "We work on the person first: discipline, character, emotional strength, and decisions you can stand on.",
      },
    ],
    ctaLabel: "Start with Leadership Mentoring",
  },
  {
    slug: "ofw-retirement-blueprint",
    title: "OFW Retirement Blueprint",
    shortDescription: "Coming home without a plan is how overseas work turns into another kind of struggle.",
    audience: "OFWs who want a real transition — not just a ticket home.",
    transformation:
      "You leave the 'I'll figure it out when I get back' loop and get a concrete plan for income, identity, and the next chapter.",
    benefits: [
      "A structured plan for the season after the contract",
      "Coaching on income, purpose, and who you are when the uniform comes off",
      "Mindset and business support so home is a build, not a crash",
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
          "No. Money matters. So does identity, business readiness, and a life that still has direction when the contract ends.",
      },
      {
        question: "Who benefits most?",
        answer:
          "OFWs who know they cannot keep doing this forever and want a strategy before they land.",
      },
    ],
    ctaLabel: "Start with the OFW Blueprint",
  },
];

export function getProgram(slug: string) {
  return programs.find((program) => program.slug === slug);
}
