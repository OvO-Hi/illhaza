import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AccountClient } from "./account-client";

export const metadata = {
  title: "내 계정",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <AccountClient userRole={user.role} />;
}
