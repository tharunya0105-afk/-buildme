"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HardHat, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get("role");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"engineer" | "homeowner">(
    (preselectedRole as "engineer" | "homeowner") || "engineer"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Auto sign in after successful signup
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/auth/login");
        return;
      }

      router.push(role === "engineer" ? "/engineer" : "/homeowner");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <HardHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-text-primary">
              BuildMe
            </span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Create your account
          </h2>
          <p className="text-sm text-text-secondary mb-8">
            Join BuildMe to start monitoring your construction sites.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-status-review-bg border border-status-review-border text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("engineer")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-md border text-sm font-medium transition-colors ${
                    role === "engineer"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-text-secondary hover:border-border-strong hover:bg-surface-alt"
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  Engineer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("homeowner")}
                  className={`flex items-center justify-center gap-2 p-3 rounded-md border text-sm font-medium transition-colors ${
                    role === "homeowner"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-text-secondary hover:border-border-strong hover:bg-surface-alt"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Homeowner
                </button>
              </div>
            </div>

            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              autoComplete="name"
            />

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-primary items-center justify-center">
        <div className="text-center px-12">
          <HardHat className="h-16 w-16 text-white/90 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Start monitoring today
          </h2>
          <p className="text-white/80 text-lg">
            {role === "engineer"
              ? "Manage multiple sites with AI-assisted insights."
              : "Track your home construction progress in real time."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
