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
import { Eye } from "lucide-react";
import Link from "next/link";

import { stopViewAsAction } from "@/app/dashboard/project-jdc/actions";

import { PjdcToaster } from "@/components/project-jdc/pjdc-client";
import { PjdcLive } from "@/components/project-jdc/pjdc-live";
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
import { loadMentorIds, readViewAs, requireProjectJdc } from "@/lib/project-jdc-access";
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
  banner,
  children,
}: {
  name: string;
  photoUrl?: string;
  subtitle: string;
  tabs: Tab[];
  active: string;
  banner?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="dashboard-main" tabIndex={-1} className="pjdc-app outline-none">
      {banner ? (
        <form action={stopViewAsAction} className="pjdc-viewas">
          <Eye aria-hidden size={18} />
          <span>{banner}</span>
          <button type="submit" className="pjdc-btn is-quiet">
            Back to my view
          </button>
        </form>
      ) : null}
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
        <PjdcLive />
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
  const [viewer, { tab: requested }, data] = await Promise.all([requireProjectJdc(), searchParams, loadProjectJdcData()]);
  const userById = new Map(data.users.map((item) => [item.id, item]));
  const mentorIds = [...(await loadMentorIds(data.users))];

  // Staff (admins and mentors) can open anyone's dashboard to see what they see.
  const viewAsId = viewer.isStaff ? await readViewAs(viewer.user.id) : null;
  const viewing = viewAsId ? (userById.get(viewAsId) ?? null) : null;
  const user = viewing ?? viewer.user;
  const banner = viewing ? `Viewing as ${viewing.name}` : undefined;
  const staffView = viewer.isStaff && !viewing;

  if (staffView) {
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
      <AppFrame name={user.name} photoUrl={user.facebookPhotoUrl} subtitle={subtitles[active]} tabs={tabs} active={active} banner={banner}>
        {active === "home" ? (
          <AdminHome
            facilitators={data.facilitators}
            students={data.students}
            items={data.items}
            unassignedCount={data.unassigned.length}
            sampleCount={data.sampleCount}
            today={data.today}
          />
        ) : null}
        {active === "people" ? <AdminPeople users={data.users} students={data.students} today={data.today} mentorIds={mentorIds} viewerId={user.id} /> : null}
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
      check: "Look at their proof, then say “Looks good” or “Not yet”.",
      team: "Tap a student to see how they are doing.",
      leaders: "See who is leading this week.",
      week: "Plan your week and set your goal.",
    };

    return (
      <AppFrame name={user.name} photoUrl={user.facebookPhotoUrl} subtitle={subtitles[active]} tabs={tabs} active={active} banner={banner}>
        {active === "home" ? <FacilitatorHome me={me} items={myItems} plan={plan} pending={pending} today={data.today} /> : null}
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
  // Their own tasks carry facilitator review notes, which is fine; other students' proof is never sent.
  const myTeam = data.facilitators
    .filter((facilitator) => facilitator.id === me?.facilitatorId)
    .map((facilitator) => ({
      ...facilitator,
      students: facilitator.students.map((student) => ({ ...student, email: "", phone: "", notes: "" })),
    }));

  return (
    <AppFrame name={user.name} photoUrl={user.facebookPhotoUrl} subtitle={subtitles[active]} tabs={tabs} active={active} banner={banner}>
      {active === "today" ? <StudentToday student={me} items={myItems} today={data.today} /> : null}
      {active === "journey" ? <StudentJourney student={me} items={myItems} today={data.today} /> : null}
      {active === "team" ? <PjdcOrgChart facilitators={myTeam} canEditStudent="none" viewerId={user.id} /> : null}
      {active === "leaders" ? <PjdcLeaderboard boards={data.leaderboards} viewerId={user.id} /> : null}
    </AppFrame>
  );
}
