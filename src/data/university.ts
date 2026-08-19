export type UniversityLesson = {
  title: string;
  summary: string;
};

export type UniversityCourse = {
  slug: string;
  title: string;
  source: string;
  summary: string;
  audience: string;
  ghlName: string;
  imageUrl?: string;
  lessons: UniversityLesson[];
};

export const universityCourses: UniversityCourse[] = [
  {
    slug: "life-and-money-mastery-series",
    title: "Life and Money Mastery Series",
    ghlName: "Life and Money Mastery Series",
    source: "JDC Elite Society · AiFunnels GHL",
    summary:
      "The money and life operating system from the JDC Elite Society membership: mindset, cash flow, and the discipline to keep both.",
    audience: "Members who need a real plan for income, savings, and follow-through.",
    lessons: [
      { title: "The plan vs the paycheck", summary: "Why work is not the problem and how to stop renting your future." },
      { title: "Cash flow without the speech", summary: "Track money like an adult: remittance, surplus, and a number you can defend." },
      { title: "OFW and employee seasons", summary: "What to do with a contract, a salary, and a family that is waiting." },
      { title: "Mastery habits", summary: "The weekly review that turns a course into a life." },
    ],
  },
  {
    slug: "exclusive-mentoring-series",
    title: "Exclusive Mentoring Series",
    ghlName: "Exclusive Mentoring Series",
    source: "JDC Elite Society · AiFunnels GHL",
    summary:
      "Closed-door mentoring from Coach JDC. Direct, specific, and meant for people already inside the membership.",
    audience: "Verified members who want the room, not another pep talk.",
    lessons: [
      { title: "How we sit in the room", summary: "What exclusive mentoring is for and what it is not." },
      { title: "Name the actual problem", summary: "Stop performing growth. Say the thing that is stuck." },
      { title: "Decisions under pressure", summary: "Family, business, and the next honest step." },
      { title: "Stay in the work", summary: "How to use mentoring between sessions so it compounds." },
    ],
  },
  {
    slug: "jdc-mastermind-session-1",
    title: "JDC Mastermind Session 1",
    ghlName: "JDC Mastermind Session 1",
    source: "JDC Elite Society · AiFunnels GHL",
    summary: "Session 1 of the JDC Mastermind. The opening board: who is in the room and what we are building.",
    audience: "JES members inside the Mastermind track.",
    lessons: [
      { title: "Open the board", summary: "The standard for this mastermind and how we work together." },
      { title: "Your current season", summary: "Name the season you are actually in, not the one that sounds impressive." },
      { title: "The 90-day cut", summary: "What has to move before the next session." },
    ],
  },
  {
    slug: "jdc-mastermind-session-2",
    title: "JDC Mastermind Session 2",
    ghlName: "JDC Mastermind Session 2",
    source: "JDC Elite Society · AiFunnels GHL",
    summary: "Session 2 of the JDC Mastermind. Pressure, progress, and the next round of decisions.",
    audience: "JES members continuing the Mastermind track.",
    lessons: [
      { title: "What moved", summary: "Review the work from Session 1 with no theater." },
      { title: "Where you stalled", summary: "The honest blockers: money, family, fear, or a missing offer." },
      { title: "Raise the standard", summary: "The next commitments before we sit again." },
    ],
  },
];

export function getUniversityCourse(slug: string) {
  return universityCourses.find((course) => course.slug === slug) ?? null;
}

export function normalizeCourseTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
