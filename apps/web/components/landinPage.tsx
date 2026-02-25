"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputFields";

import { Button } from "./ui/button";

export const LandingPage = () => {
  const [slug, setSlug] = useState("");
  const [roomID, setRoomId] = useState("");
  const [loggedin, setLoggedin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setLoggedin(true);
    }
  }, []);

  const handleCreateRoom = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { roomService } = await import("@/lib/api");

      const response = await roomService.createroom({ slug });
      console.log("room created successfully, client!", response);

      const roomid = response.data.id;
      localStorage.setItem("roomid", String(roomid));

      const roomToken = await roomService.createRoomToken({
        roomId: roomid,
        userId: JSON.parse(localStorage.getItem("user")!).id,
      });
      if (roomToken.data.RoomToken) {
        localStorage.setItem("roomToken", roomToken.data.RoomToken);
      } else {
        console.log("room token not generated, client!", roomToken);
        return;
      }

      router.push(`/room/${slug}`);
    } catch (error) {
      console.log("error while creating room, client!", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="w-full flex justify-between p-2">
        <h1 className="text-2xl font-bold">Eraserio</h1>
        <div className="flex gap-2">
          {!loggedin ? (
            <div>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => router.push("/auth/login")}
              >
                Sign In
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => router.push("/auth/register")}
              >
                Sign Up
              </Button>
            </div>
          ) : (
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setLoggedin(false);
                router.push("/");
              }}
            >
              Logout
            </Button>
          )}
        </div>
      </nav>
      <div className="flex flex-col gap-24 justify-center items-center h-screen">
        <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
          <h1 className="font-bold text-3xl">Create Room</h1>
          <InputField
            label="Slug"
            placeholder="Enter your slug"
            description="Choose a unique slug for your room"
            onChange={(e: any) => setSlug(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {loading ? "Creating Room..." : "Create Room"}
          </button>
        </form>
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-3xl">Join Room</h1>
          <InputField
            label="Room ID"
            placeholder="Enter your Room ID"
            description="Enter the room ID to join"
            onChange={(e: any) => setRoomId(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};
