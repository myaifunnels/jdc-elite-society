import { NextResponse } from "next/server";

import { hasAccess } from "@/lib/access";
import { resolveAccess } from "@/lib/access-store";
import { suggestContacts } from "@/lib/crm-store";
import { getSessionUser } from "@/lib/session";
import { uniqueTags } from "@/lib/tags";
import { ContactKind } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const access = await resolveAccess(user);
  if (!hasAccess(access, "contacts.view") && !hasAccess(access, "registrations")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const kindValue = params.get("kind");
  const kind: ContactKind | undefined =
    kindValue === "partner" || kindValue === "contact" ? kindValue : undefined;
  const viewer = { ...user, seeAllContacts: hasAccess(access, "contacts.all") };

  const result = await suggestContacts(viewer, {
    kind: hasAccess(access, "contacts.all") ? kind : "contact",
    tags: uniqueTags(params.getAll("tag")),
    q: params.get("q") ?? "",
  });

  return NextResponse.json(result);
}
