// store/useChatStore.ts
import { create } from "zustand";
import { message_format } from "@/types/chat";

interface ChatState {
  messages: message_format[];
  users: string[];
  isConnected: boolean;

  addMessage: (msg: message_format) => void;
  setConnected: (status: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  users: [],
  isConnected: false,

  addMessage: (msg: message_format) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setConnected: (status: boolean) => set({ isConnected: status }),
}));
