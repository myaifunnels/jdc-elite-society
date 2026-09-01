import { NextRequest, NextResponse } from "next/server";

import { isEliteHost } from "@/lib/site";

export function proxy(request: NextRequest) {
  if (!isEliteHost(request.headers.get("host"))) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "") {
    const url = request.nextUrl.clone();
    url.pathname = "/elite";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/thank-you") {
    const url = request.nextUrl.clone();
    url.pathname = "/elite/thank-you";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/thank-you"],
};
