import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AFFILIATE_COOKIE, normalizeAffiliateCode } from "@/lib/affiliate";
import { getProfileByCode, recordAttribution } from "@/lib/affiliate-store";
import { createLead } from "@/lib/crm-store";
import { syncContactToGhl } from "@/lib/ghl";
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

  const cookieStore = await cookies();
  const referralCode = normalizeAffiliateCode(cookieStore.get(AFFILIATE_COOKIE)?.value ?? "");
  const affiliate = referralCode ? await getProfileByCode(referralCode) : null;

  const audience = parsed.data.bestDescribesYou?.trim() || "Not specified";
  const extraTags = affiliate ? [`affiliate:${affiliate.code}`] : [];
  const lead = createLead({
    ...parsed.data,
    bestDescribesYou: audience,
    tags: Array.from(
      new Set(
        [
          ...parsed.data.tags.split(",").map((tag) => tag.trim()),
          audience !== "Not specified" ? audience : "",
          ...extraTags,
        ].filter(Boolean),
      ),
    ),
    source: affiliate ? `Website inquiry · ${affiliate.code}` : "Website inquiry",
  });

  if (affiliate) {
    await recordAttribution({
      kind: "inquiry",
      code: affiliate.code,
      email: parsed.data.email,
      name: parsed.data.name,
    });
  }

  await syncContactToGhl({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    dateOfBirth: parsed.data.dateOfBirth,
    address: parsed.data.address,
    city: parsed.data.city,
    bestDescribesYou: audience,
    source: affiliate ? `Website inquiry · ${affiliate.code}` : "Website inquiry",
    tags: [parsed.data.programInterest, "Inquiry", ...extraTags],
  });

  return NextResponse.json({ lead });
}
