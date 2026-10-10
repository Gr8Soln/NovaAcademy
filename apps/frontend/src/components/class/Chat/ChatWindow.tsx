import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useRef, useState, useCallback } from "react";

import { classApi, chatApi } from "@/lib/api/chat";
import { useAuthStore } from "@/stores";
import { useWebSocket } from "@/hooks/use-websocket";

import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatSidebar from "./ChatSidebar";
import ChatMessage, { type MessageData } from "./Message";

interface ChatWindowProps {
  classCode: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ classCode }) => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    senderName: string;
    content: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((state) => state.user);

  // Fetch Class Details
  const { data: groupData } = useQuery({
    queryKey: ["class", classCode],
    queryFn: () => classApi.getClass(classCode),
    enabled: !!classCode,
  });

  // Fetch Historical Messages
  const { data: initialMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", classCode],
    queryFn: () => chatApi.getMessages(classCode),
    enabled: !!classCode,
  });

  // Load initial messages
  useEffect(() => {
    if (initialMessages) {
      // Map backend format to UI format if necessary
      const mapped = (initialMessages as any[]).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender_id,
          name: msg.sender_id === currentUser?.id ? "You" : (msg.sender_name || "Member"),
          role: msg.sender_role || "member",
          avatar: msg.sender_avatar,
          isOnline: false // Updated via presence events
        },
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        replyTo: msg.reply_to_id ? { id: msg.reply_to_id, senderName: "...", content: "..." } : undefined,
        status: "read" as const
      }));
      setMessages(mapped);
    }
  }, [initialMessages, currentUser?.id]);

  // WebSocket Integration
  const wsUrl = groupData?.id ? `${import.meta.env.VITE_WS_URL || "ws://localhost:8000"}/api/v1/chat/groups/${groupData.id}` : null;

  const onWsMessage = useCallback((data: any) => {
    if (data.type === "message") {
      const msg = data.payload;
      const newMsg: MessageData = {
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender_id,
          name: msg.sender_id === currentUser?.id ? "You" : (msg.sender_name || "Member"),
          role: msg.sender_role || "member",
          avatar: msg.sender_avatar
        },
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        replyTo: msg.reply_to_id ? { id: msg.reply_to_id, senderName: "...", content: "..." } : undefined,
        status: "read" as const
      };
      setMessages((prev) => [...prev, newMsg]);
    } else if (data.type === "user_joined" || data.type === "user_left") {
      // Handle presence updates if needed
      console.log("Presence update:", data);
    }
  }, [currentUser?.id]);

  const { status: wsStatus, send: sendWs } = useWebSocket(wsUrl, { onMessage: onWsMessage });

  // Presence Heartbeat
  useEffect(() => {
    if (wsStatus === "connected") {
      const interval = setInterval(() => {
        sendWs({ type: "heartbeat" });
      }, 30000); // 30s heartbeat
      return () => clearInterval(interval);
    }
  }, [wsStatus, sendWs]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (content: string, _attachments?: File[]) => {
    if (!groupData?.id) return;

    try {
      await chatApi.sendMessage(classCode, {
        group_id: groupData.id,
        content,
        message_type: "text",
        reply_to_id: replyTo?.id
      });
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleReply = (msg: MessageData) => {
    setReplyTo({
      id: msg.id,
      senderName: msg.sender.name,
      content: msg.content || "(attachment)",
    });
  };

  if (!classCode) return <div>Select a class...</div>;

  return (
    <div className="flex h-full min-h-0 bg-white overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <ChatHeader
          groupName={groupData?.name || "Loading..."}
          groupAvatar={groupData?.avatar_url}
          memberCount={groupData?.member_count || 0}
          onlineCount={0} // To be implemented with Redis presence
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-1 text-black">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full text-neutral-400">Loading messages...</div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.sender.id === currentUser?.id}
                onReply={handleReply}
              />
            ))
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          members={groupData?.members?.map((m: any) => ({ id: m.user_id, name: m.username })) || []}
          disabled={wsStatus !== "connected"}
        />
      </div>

      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        groupName={groupData?.name || ""}
        groupAvatar={groupData?.avatar_url}
        groupDescription={groupData?.description || ""}
        memberCount={groupData?.member_count || 0}
        isAdmin={false}
      />
    </div>
  );
};

export default ChatWindow;
