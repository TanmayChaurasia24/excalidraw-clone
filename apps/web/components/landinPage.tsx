"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "./InputFields";
import { Button } from "./ui/button";

export const LandingPage = () => {
  const [slug, setSlug] = useState("");
  const [roomID, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {};

  return (
    <div>
      <nav className="bg-yellow-200 w-full flex justify-between p-2">
        <h1 className="text-2xl font-bold">Eraserio</h1>
        <div className="flex gap-2">
            <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => router.push("/auth/login")}>Sign In</Button>
            <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => router.push("/auth/register")}>Sign Up</Button>
        </div>
      </nav>
      <div className="flex flex-col gap-24 justify-center items-center h-screen">
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-3xl">Create Room</h1>
          <InputField
            label="Slug"
            placeholder="Enter your slug"
            description="Choose a unique slug for your room"
            onChange={(e: any) => setSlug(e.target.value)}
          />
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Room
          </button>
        </div>
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
