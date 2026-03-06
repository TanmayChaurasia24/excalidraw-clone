"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Canvas from "@/components/canvas";

export default function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [users, setUsers] = useState<
    { userId: string; name: string; email: string }[]
  >([]);
  const [chatMessages, setChatMessages] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);

  const { slug } = use(params);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const roomToken = localStorage.getItem("roomToken");
    const userStr = localStorage.getItem("user");

    if (!token || !roomToken || !userStr) {
      router.push("/auth/login");
      return;
    }

    const user = JSON.parse(userStr);

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join_room",
          token: roomToken,
          userId: user.id,
          name: user.name,
          email: user.email,
        }),
      );
    };

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket message received:", data);

      if (data.type === "error") {
        setError(data.message);
        setLoading(false);
      } else if (data.type === "joined") {
        setRoomId(data.roomId);
        if (data.users) setUsers(data.users);
        setLoading(false);
        setSocket(ws);
      } else if (data.type === "user_joined") {
        setUsers((prev) => [...prev, data.user]);
      } else if (data.type === "user_left") {
        setUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      } else if (data.type === "receive_message") {
        setMessages((prev) => [
          ...prev,
          { text: data.text, userId: data.userId, name: data.name },
        ]);
      }
    };

    ws.addEventListener("message", handleMessage);

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
      setError("Failed to connect to chat server");
      setLoading(false);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setSocket(null);
    };

    return () => {
      ws.onopen = null;
      ws.removeEventListener("message", handleMessage);
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    };
  }, [router]);

  useEffect(() => {
    if (!roomId) return;

    const fetchChatRoom = async () => {
      try {
        const { chatService } = await import("@/lib/api");
        const { data } = await chatService.getChat(roomId.toString());
        if (!data) {
          setError("Failed to fetch chat room");
          return;
        }
        console.log(data);
        const msg = data.map((m: any) => {
          return {
            text: m.message,
            userId: m.userId,
            name: m.user?.name,
          };
        });
        setMessages(msg);
      } catch (error) {
        console.log(error);
      }
    };

    fetchChatRoom();
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p className="text-xl font-semibold">Joining Room {slug}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center h-screen bg-gray-900 text-white">
        <p className="text-xl font-semibold text-red-500">Error: {error}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleChatMessageSubmit = (e: any) => {
    e.preventDefault();
    try {
      if (!socket || !roomId || !chatMessages) {
        console.log("Missing required fields");
        return;
      }

      console.log("Sending message", chatMessages);
      socket.send(
        JSON.stringify({
          type: "send_message",
          text: chatMessages,
        }),
      );

      const localUserStr = localStorage.getItem("user");
      const localUser = localUserStr ? JSON.parse(localUserStr) : null;
      if (localUser) {
        setMessages((prev) => [
          ...prev,
          { text: chatMessages, userId: localUser.id, name: localUser.name },
        ]);
      }

      setChatMessages("");
    } catch (error) {
      console.log("Error sending message, client!", error);
      setError("Failed to send message");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-white flex-row">
      {/* Canvas Area - Left side */}
      <div className="w-[70vw] relative h-full">
        <Canvas roomId={roomId?.toString() ?? ""} socket={socket} />
        
        {/* Room Info Overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {roomId && (
            <div className="p-3 bg-gray-800/80 backdrop-blur rounded-lg border border-gray-700 shadow-md inline-block">
              <p className="text-xs text-gray-400 mb-1 font-semibold">
                Room ID:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-gray-900 px-2 py-1 rounded border border-gray-700 text-blue-400">
                  {roomId}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(roomId));
                    alert("Room ID copied to clipboard!");
                  }}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          <div className="p-3 bg-gray-800/80 backdrop-blur rounded-lg border border-gray-700 shadow-md inline-block">
             <p className="text-xs text-gray-400 font-semibold mb-1">Users in room: {users.length}</p>
             <p className="text-xs text-green-400 font-medium">🟢 Connected</p>
          </div>
        </div>
      </div>

      {/* Chat Sidebar UI - Right side */}
      <div className="w-[30vw] border-l border-gray-700 bg-gray-800 flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b border-gray-700 bg-gray-800 flex flex-col items-start justify-center">
          <h2 className="text-lg font-bold text-gray-100">Room Chat</h2>
          <span className="text-xs text-green-400 font-medium tracking-wide uppercase">
            Online • Everyone can chat
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-4">
              No messages yet. Be the first to start the conversation!
            </p>
          ) : (
            messages.map((m, i) => {
              const isMe =
                m.userId ===
                JSON.parse(localStorage.getItem("user") || "{}").id;

              const u = users.find((user) => user.userId === m.userId);
              const userName = isMe ? "You" : m.name || u?.name || "User";

              if (isMe) {
                return (
                  <div
                    key={i}
                    className="self-end relative bg-blue-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%] shadow-sm"
                  >
                    <span className="text-xs font-bold text-blue-200 mb-1 block">
                      {userName}
                    </span>
                    <p className="text-sm text-white pb-3">{m.text}</p>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="self-start relative bg-gray-700 border border-gray-600 rounded-2xl rounded-tl-sm p-3 max-w-[85%] shadow-sm"
                >
                  <span className="text-xs font-bold text-blue-400 mb-1 block">
                    {userName}
                  </span>
                  <p className="text-sm text-gray-100 pb-3">{m.text}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <form className="flex gap-2" onSubmit={handleChatMessageSubmit}>
            <input
              type="text"
              placeholder="Type your message..."
              onChange={(e) => setChatMessages(e.target.value)}
              value={chatMessages}
              className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 ml-0.5"
              >
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
