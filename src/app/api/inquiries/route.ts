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

  const lead = createLead({
    ...parsed.data,
    tags: parsed.data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    source: "Website inquiry",
  });

  return NextResponse.json({ lead });
}
