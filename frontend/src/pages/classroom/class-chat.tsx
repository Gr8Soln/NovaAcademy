import { useParams } from "react-router-dom";
import { ChatWindow } from "@/components/class/Chat";

export default function ClassChatPage() {
  const { classCode } = useParams<{ classCode: string }>();

  return (
    <div className="h-full overflow-hidden">
      <ChatWindow classCode={classCode || ""} />
    </div>
  );
}
