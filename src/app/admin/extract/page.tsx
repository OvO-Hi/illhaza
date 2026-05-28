import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ExtractClient } from "./extract-client";

export default async function ExtractPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return <ExtractClient />;
}
