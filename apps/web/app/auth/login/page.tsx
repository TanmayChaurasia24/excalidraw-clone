"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "@/components/InputFields";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { authService } = await import("@/lib/api");
      const data = await authService.signin({ email, password });

      // Store token (in production, cookies with HttpOnly might be better, but localStorage is common in basic setups)
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Login to Eraserio
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <InputField
            label="Email"
            type="email"
            placeholder="john@example.com"
            onChange={(e: any) => setEmail(e.target.value)}
          />
          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            onChange={(e: any) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            href="/auth/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
