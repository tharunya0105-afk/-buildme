"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HardHat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/engineer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError(result.error);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
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
            Sign in to your account
          </h2>
          <p className="text-sm text-text-secondary mb-8">
            Enter your credentials to access your dashboard.
          </p>

          {(error || formError) && (
            <div className="mb-4 p-3 rounded-md bg-status-review-bg border border-status-review-border text-sm text-danger">
              {formError || "Authentication failed. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 bg-surface-alt rounded-lg border border-border">
            <p className="text-[10px] font-semibold text-text-primary mb-1">Demo Credentials</p>
            <div className="space-y-1 text-[10px] text-text-muted">
              <p><strong>Engineer:</strong> engineer@buildme.demo / demo1234</p>
              <p><strong>Homeowner:</strong> rkumar@buildme.demo / demo1234</p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-primary items-center justify-center">
        <div className="text-center px-12">
          <HardHat className="h-16 w-16 text-white/90 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Construction visibility
          </h2>
          <p className="text-white/80 text-lg">
            Monitor your sites. Keep homeowners informed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
