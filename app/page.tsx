import { redirect } from "next/navigation";
import { getAuthenticatedAdult } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  redirect((await getAuthenticatedAdult()) ? "/my-kinward" : "/sign-in");
}
