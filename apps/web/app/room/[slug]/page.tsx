"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

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

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9000";
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

    ws.onmessage = (event) => {
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
      }
    };

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
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl font-semibold">Joining Room {slug}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 justify-center items-center h-screen">
        <p className="text-xl font-semibold text-red-500">Error: {error}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Room: {slug}</h1>

      {roomId && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg inline-block border">
          <p className="text-sm text-gray-600 mb-2 font-semibold">
            Share this Room ID with others to join:
          </p>
          <div className="flex items-center gap-3">
            <code className="text-xl font-mono bg-white px-3 py-1 rounded border shadow-inner text-blue-600">
              {roomId}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(String(roomId));
                alert("Room ID copied to clipboard!");
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Copy ID
            </button>
          </div>
        </div>
      )}

      <p className="text-green-600 font-medium bg-green-50 p-3 rounded-md inline-block">
        🟢 Successfully connected to WebSocket server!
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Users in the room: ({users.length})
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {users.map((u, i) => (
            <li
              key={i}
              className="flex flex-col bg-white p-4 rounded-lg shadow-sm border border-gray-200"
            >
              <span className="font-semibold text-gray-800">
                {u.name || "Unknown"}{" "}
                {u.userId ===
                JSON.parse(localStorage.getItem("user") || "{}").id
                  ? "(You)"
                  : ""}
              </span>
              <span className="text-sm text-gray-500">
                {u.email || "No email"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
