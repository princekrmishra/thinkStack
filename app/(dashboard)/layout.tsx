import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatProvider } from "@/context/ChatContext";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <ChatProvider>{children}</ChatProvider>;
}