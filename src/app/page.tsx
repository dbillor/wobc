import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (hasSession) {
    redirect("/studio");
  }

  redirect("/login");
}
