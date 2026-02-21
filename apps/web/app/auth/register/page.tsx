"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "@/components/InputFields";
import { Button } from "@/components/ui/button";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { authService } = await import("@/lib/api");
      const data = await authService.signup({ name, email, password });

      // Automatically log the user in
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Sign Up for Eraserio
        </h1>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <InputField
            label="Name"
            type="text"
            placeholder="John Doe"
            onChange={(e: any) => setName(e.target.value)}
          />
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
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
