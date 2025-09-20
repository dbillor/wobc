import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

export default function HomePage() {
  const hasSession = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (hasSession) {
    redirect("/studio");
  }

  redirect("/login");
}
