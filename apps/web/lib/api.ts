const API_URL = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:8080";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetcher(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.message || "An error occurred", res.status);
  }

  return data;
}

export const authService = {
  signup: async (data: Record<string, any>) => {
    return fetcher("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  signin: async (data: Record<string, any>) => {
    return fetcher("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export const roomService = {
  createroom: async (data: any) => {
    return fetcher("/api/rooms/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });
  },

  createRoomToken: async (data: any) => {
    return fetcher(`/api/rooms/${data.roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ userId: data.userId }),
    });
  },

  fetchInitialCanvas: async (roomId: string) => {
    return fetcher(`/api/rooms/elements/${roomId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
  },
};

export const chatService = {
  getChat: async (roomId: string) => {
    return fetcher(`/api/chats/${roomId}`, {
      method: "GET",
    });
  },
};
