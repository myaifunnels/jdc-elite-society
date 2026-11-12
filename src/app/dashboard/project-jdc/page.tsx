import {
  CalendarDays,
  ClipboardCheck,
  House,
  Map as MapIcon,
  Network,
  Sun,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { PjdcToaster } from "@/components/project-jdc/pjdc-client";
import { PjdcLeaderboard } from "@/components/project-jdc/pjdc-leaderboard";
import { PjdcOrgChart } from "@/components/project-jdc/pjdc-org-chart";
import {
  AdminHome,
  AdminPeople,
  AdminWeek,
  FacilitatorCheck,
  FacilitatorHome,
  FacilitatorWeek,
  GiveTaskButton,
} from "@/components/project-jdc/pjdc-staff";
import { StudentJourney, StudentToday } from "@/components/project-jdc/pjdc-student";
import { firstName, PjdcAvatar } from "@/components/project-jdc/pjdc-ui";
import { loadProjectJdcData, type PjdcFacilitator } from "@/lib/project-jdc-view";
import { requireCapability } from "@/lib/session";
import { cn } from "@/lib/utils";

const BASE = "/dashboard/project-jdc";

type Tab = { key: string; label: string; icon: LucideIcon; badge?: number };

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Manila" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function AppFrame({
  name,
  photoUrl,
  subtitle,
  tabs,
  active,
  children,
}: {
  name: string;
  photoUrl?: string;
  subtitle: string;
  tabs: Tab[];
  active: string;
  children: React.ReactNode;
}) {
  return (
    <main id="dashboard-main" tabIndex={-1} className="pjdc-app outline-none">
      <header className="pjdc-top">
        <PjdcAvatar name={name} photoUrl={photoUrl} size="md" />
        <div>
          <h1>
            {greeting()}, {firstName(name)}!
          </h1>
          <p>{subtitle}</p>
        </div>
        <p className="pjdc-date">
          {new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Manila" }).format(new Date())}
        </p>
      </header>

      <div className="pjdc-screen">{children}</div>

      <nav className="pjdc-tabbar" aria-label="Project JDC">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={`${BASE}?tab=${tab.key}`}
              className={cn("pjdc-tab", isActive && "is-active")}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="pjdc-tab-icon">
                <Icon aria-hidden size={22} strokeWidth={isActive ? 2.4 : 2} />
                {tab.badge ? <b aria-label={`${tab.badge} waiting`}>{tab.badge > 99 ? "99+" : tab.badge}</b> : null}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <PjdcToaster />
    </main>
  );
}

function pickTab(requested: string | undefined, tabs: Tab[]) {
  return tabs.some((tab) => tab.key === requested) ? requested! : tabs[0].key;
}

export default async function ProjectJdcPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ user }, { tab: requested }, data] = await Promise.all([
    requireCapability("projectJdc"),
    searchParams,
    loadProjectJdcData(),
  ]);
  const userById = new Map(data.users.map((item) => [item.id, item]));

  if (user.role === "admin") {
    const tabs: Tab[] = [
      { key: "home", label: "Home", icon: House },
      { key: "people", label: "People", icon: Users },
      { key: "team", label: "Team", icon: Network },
      { key: "leaders", label: "Leaders", icon: Trophy },
      { key: "week", label: "Week", icon: CalendarDays },
    ];
    const active = pickTab(requested, tabs);
    const subtitles: Record<string, string> = {
      home: "Here is how Project JDC is doing.",
      people: "Add people and give students a facilitator.",
      team: "Tap anyone to see how they are doing.",
      leaders: "Who is leading this week.",
      week: "Each facilitator's plan for this week.",
    };

    return (
      <AppFrame name={user.name} photoUrl={user.facebookPhotoUrl} subtitle={subtitles[active]} tabs={tabs} active={active}>
        {active === "home" ? (
          <AdminHome
            facilitators={data.facilitators}
            students={data.students}
            unassignedCount={data.unassigned.length}
            today={data.today}
          />
        ) : null}
        {active === "people" ? <AdminPeople users={data.users} students={data.students} today={data.today} /> : null}
        {active === "team" ? (
          <PjdcOrgChart
            facilitators={data.facilitators}
            unassigned={data.unassigned}
            canEditStudent="all"
            canEditFacilitator
            viewerId={user.id}
          />
        ) : null}
        {active === "leaders" ? <PjdcLeaderboard boards={data.leaderboards} viewerId={user.id} /> : null}
        {active === "week" ? <AdminWeek facilitators={data.facilitators} plans={data.plans} today={data.today} /> : null}
      </AppFrame>
    );
  }

  if (user.role === "facilitator") {
    const me: PjdcFacilitator = data.facilitators.find((item) => item.id === user.id) ?? {
      id: user.id,
      name: user.name,
      photoUrl: user.facebookPhotoUrl ?? "",
      status: "active",
      target: 0,
      targetLabel: "",
      newThisWeek: 0,
      students: [],
    };
    const myItems = data.items.filter((item) => item.facilitatorId === user.id);
    const pending = myItems.filter((item) => item.studentDone && !item.facilitatorApproved).length;
    const plan = data.plans.get(user.id) ?? null;

    const tabs: Tab[] = [
      { key: "home", label: "Home", icon: House },
      { key: "check", label: "Check", icon: ClipboardCheck, badge: pending },
      { key: "team", label: "Team", icon: Network },
      { key: "leaders", label: "Leaders", icon: Trophy },
      { key: "week", label: "My week", icon: CalendarDays },
    ];
    const active = pickTab(requested, tabs);
    const subtitles: Record<string, string> = {
      home: me.students.length ? `You have ${me.students.length} student${me.students.length === 1 ? "" : "s"}.` : "Let's get started.",
      check: "Say “Looks good” when a student finishes a task.",
      team: "Tap a student to see how they are doing.",
      leaders: "See who is leading this week.",
      week: "Plan your week and set your goal.",
    };

    return (
      <AppFrame name={user.name} photoUrl={user.facebookPhotoUrl} subtitle={subtitles[active]} tabs={tabs} active={active}>
        {active === "home" ? <FacilitatorHome me={me} plan={plan} pending={pending} today={data.today} /> : null}
        {active === "check" ? <FacilitatorCheck items={myItems} userById={userById} today={data.today} /> : null}
        {active === "team" ? (
          <div className="pjdc-stack">
            <GiveTaskButton students={me.students} today={data.today} className="pjdc-btn is-primary is-big is-wide is-fit" />
            <PjdcOrgChart facilitators={[me]} canEditStudent="own" viewerId={user.id} />
          </div>
        ) : null}
        {active === "leaders" ? <PjdcLeaderboard boards={data.leaderboards} viewerId={user.id} initialBoard="facilitators" /> : null}
        {active === "week" ? <FacilitatorWeek plan={plan} weekStart={data.weekStart} today={data.today} /> : null}
      </AppFrame>
    );
  }

  // Student
  const me = data.students.find((item) => item.id === user.id) ?? null;
  const myItems = data.items.filter((item) => item.studentId === user.id);
  const tabs: Tab[] = [
    { key: "today", label: "Today", icon: Sun },
    { key: "journey", label: "My 30 days", icon: MapIcon },
    { key: "team", label: "Team", icon: Network },
    { key: "leaders", label: "Leaders", icon: Trophy },
  ];
  const active = pickTab(requested, tabs);
  const subtitles: Record<string, string> = {
    today: me && me.day >= 1 ? "Here is what to do today." : "Welcome to Project JDC!",
    journey: "Every day you show up counts.",
    team: "Your facilitator and your teammates.",
    leaders: "See who is leading this week.",
  };

  // Students only see names, photos and progress of their teammates, never contact details or notes.
  const myTeam = data.facilitators
    .filter((facilitator) => facilitator.id === me?.facilitatorId)
    .map((facilitator) => ({
      ...facilitator,
      students: facilitator.students.map((student) => ({ ...student, email: "", phone: "", notes: "" })),
    }));

  return (
    <AppFrame name={user.name} photoUrl={user.facebookPhotoUrl} subtitle={subtitles[active]} tabs={tabs} active={active}>
      {active === "today" ? <StudentToday student={me} items={myItems} today={data.today} /> : null}
      {active === "journey" ? <StudentJourney student={me} items={myItems} today={data.today} /> : null}
      {active === "team" ? <PjdcOrgChart facilitators={myTeam} canEditStudent="none" viewerId={user.id} /> : null}
      {active === "leaders" ? <PjdcLeaderboard boards={data.leaderboards} viewerId={user.id} /> : null}
    </AppFrame>
  );
}
