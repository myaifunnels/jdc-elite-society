import { NextResponse } from "next/server";

import { registerInquiry } from "@/lib/inquiry";
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

  const result = await registerInquiry(parsed.data);

  if (result.duplicate) {
    return NextResponse.json(result, { status: 409 });
  }

  return NextResponse.json(result);
}
