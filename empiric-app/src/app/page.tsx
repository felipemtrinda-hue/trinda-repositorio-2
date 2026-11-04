import { redirect } from "next/navigation";
import { getProfile, HOME_BY_ROLE } from "@/lib/auth";

export default async function Root() {
  const profile = await getProfile();
  redirect(profile && profile.status !== "blocked" ? HOME_BY_ROLE[profile.role] : "/login");
}
