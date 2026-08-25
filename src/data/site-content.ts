import { NavItem, SiteStat } from "@/lib/types";

export const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  {
    href: "/programs",
    label: "Programs",
    children: [
      { href: "/elite", label: "JDC Mastermind" },
      { href: "/programs/1-on-1-coaching#online", label: "Online Coaching" },
      { href: "/programs/1-on-1-coaching#face-to-face", label: "Face to Face Coaching" },
      { href: "/programs/90-day-blueprint", label: "90-Day Blueprint" },
    ],
  },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const heroStats: SiteStat[] = [
  { value: "OFWs", label: "Building a life after the contract" },
  { value: "Employees", label: "Ready to stop renting their future" },
  { value: "First-time owners", label: "Turning an idea into a real offer" },
];

export const siteContent = {
  title: "Coach Jayson Dela Cruz",
  eyebrow: "A message from Coach JDC",
  headline: "Work isn't the problem.\nThe plan is.",
  subheadline:
    "I coach OFWs, employees, and first-time entrepreneurs: mindset, business, and the discipline to follow through.",
  heroTags: ["OFWs", "Employees", "First-time entrepreneurs"],
  primaryCta: { href: "/contact", label: "Talk to me" },
  secondaryCta: { href: "/programs", label: "See the programs" },
  headerCta: "Talk to me",
  programsEyebrow: "Where we start",
  programsHeading: "Six tracks. One standard: you do the work.",
  programsLink: "See all programs",
  problemEyebrow: "Let me talk to you",
  problemHeading: "If this is your life right now, we should talk.",
  problemIntro:
    "You're not here because you're lazy. You're here because you've been carrying everyone, waiting for a cleaner season, and the season never comes. I don't need you fired up. I need you honest.",
  problemPoints: [
    {
      title: "You're providing. You're not building.",
      body: "The salary lands. The remittance goes out. The family is okay. You are tired. And you still don't have a plan that belongs to you.",
    },
    {
      title: "You keep calling it 'next year.'",
      body: "The idea stays in your notes. The course stays unfinished. The business stays a speech you give at dinner. Hoping is not a strategy.",
    },
    {
      title: "Nobody around you will say this.",
      body: "People praise your grind. They don't ask what the grind is for. I will. Then I'll give you a structure so the answer isn't just talk.",
    },
  ],
  mentorEyebrow: "From me to you",
  mentorHeading: "I'll tell you where you are. Then we build from there.",
  mentorBody:
    "I work with Filipinos who are already working hard — OFWs, employees, and first-time entrepreneurs. My job is not to make you feel unstoppable for a night. My job is to look at where you actually are, give you a plan, and stay with you while you execute it.",
  mentorPoints: [
    "I coach the person, not the highlight reel.",
    "I mix mindset work with a business you can actually run.",
    "I will not do the work for you. I will not let you hide from it either.",
  ],
  frameworkHeading: "The Six Non-Negotiables",
  frameworkBody:
    "This is the standard I coach from. Not slogans. Six things I will keep bringing you back to when you want to negotiate with yourself.",
  frameworkItems: [
    "Tell the truth about where you are.",
    "Train your mind before you chase the money.",
    "Show up on the days you don't feel like it.",
    "Execute something small, every week.",
    "Stay accountable. No disappearing.",
    "Build a life that still works when the job ends.",
  ],
  deliveryEyebrow: "How I work with you",
  deliveryHeading: "Simple on purpose. Heavy on follow-through.",
  communityBullets: [
    "We name the real problem, not the story you tell other people.",
    "You enter the program track that matches your season — mindset, business, leadership, the OFW transition, or the Mastermind.",
    "You get the sessions, frameworks, and a community of people doing the same work.",
    "You execute. I ask what you did. That's the relationship.",
  ],
  faqEyebrow: "Straight answers",
  faqHeading: "Questions I get before someone is ready to start.",
  faq: [
    {
      question: "Who is this for?",
      answer:
        "OFWs, employees, and people building a business for the first time. If you're tired of repeating the same year and you're willing to be coached, this is for you. If you want a pep talk, this isn't it.",
    },
    {
      question: "Do I need a business already?",
      answer:
        "No. Some people come with an idea. Some come with a job and a date in their head. We start from where you actually are, not where you pretend you are.",
    },
    {
      question: "I'm working abroad. Can I still do this?",
      answer:
        "Yes. Distance is not the issue. Follow-through is. A lot of the people I coach are OFWs who need a plan for home, income, and identity after the contract.",
    },
    {
      question: "How do we start?",
      answer:
        "Send me a message. Tell me where you are and which program looks right. I'll review it, and we'll talk about the next honest step.",
    },
  ],
  inquiry: {
    eyebrow: "Start here",
    heading: "Tell me where you are. I'll tell you what I see.",
    body: "Don't write this to impress me. Write it like a person. I read these.",
    helper: "I use this to understand your situation and reply with a next step.",
    submit: "Send this to me",
    submitting: "Sending...",
    success: "I received this. I'll review it and follow up.",
    nextHeading: "What happens next",
    nextSteps: [
      "You tell me where you are and which program you're considering.",
      "I review it. No automated pep talk.",
      "We talk about whether it's a fit.",
      "If it is, we start the work.",
    ],
  },
  footerBlurb:
    "I coach OFWs, employees, and first-time entrepreneurs who are done hoping next year will be different. Mindset. Business. A standard you can keep.",
};
