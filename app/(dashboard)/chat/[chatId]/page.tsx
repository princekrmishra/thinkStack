import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>; // ← params is a Promise
}) {
  const { chatId } = await params; // ← await params

  return <ChatInterface initialChatId={chatId} />;
}