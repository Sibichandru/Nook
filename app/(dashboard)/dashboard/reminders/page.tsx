import { getCurrentUserWithRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReminders } from "./action";
import RemindersClient from "./RemindersClient";

export default async function RemindersPage() {
  const session = await getCurrentUserWithRole();
  if (!session?.user) {
    redirect('/login');
  }

  const { data: reminders } = await getReminders();

  return <RemindersClient initialReminders={reminders ?? []} />;
}
