import { NextResponse } from "next/server";

import { createLead } from "@/lib/crm-store";
import { leadSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = leadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const audience = parsed.data.bestDescribesYou?.trim() || "Not specified";
  const lead = createLead({
    ...parsed.data,
    bestDescribesYou: audience,
    tags: Array.from(
      new Set(
        [
          ...parsed.data.tags.split(",").map((tag) => tag.trim()),
          audience !== "Not specified" ? audience : "",
        ].filter(Boolean),
      ),
    ),
    source: "Website inquiry",
  });

  return NextResponse.json({ lead });
}
