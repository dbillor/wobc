import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, AUTH_PASSCODE, isProduction } from "@/lib/auth/constants";

interface LoginPayload {
  passcode?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const passcode = body.passcode?.trim();

  if (!passcode) {
    return NextResponse.json({ error: "Passcode required." }, { status: 400 });
  }

  if (AUTH_PASSCODE && passcode !== AUTH_PASSCODE) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "granted",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });

  return response;
}
