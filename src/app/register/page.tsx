"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DotsBackground from "@/components/visual/dots-background";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    const { error } = await authClient.signUp.email({ name, email, password });
    if (error) {
      setError("Registration failed");
      setLoading(false);
      return;
    }
    router.push("/sign-in?registered=true");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient + dots */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_800px_at_80%_20%,oklch(0.35_0.25_300/_0.6),transparent_70%),radial-gradient(800px_600px_at_20%_80%,oklch(0.45_0.2_310/_0.6),transparent_70%),linear-gradient(135deg,oklch(0.3_0.12_300),oklch(0.22_0.07_300))]" />
      <DotsBackground density={12} speed={18} interactionRadius={90} color="rgba(255,255,255,0.35)" opacity={0.9} className="-z-10 pointer-events-none" />

      <div className="mx-auto grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
        {/* Left: Auth panel */}
        <div className="flex items-center justify-center px-4 py-10 md:px-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardDescription>Join your team and start tracking bugs</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="off" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="off" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account? <Link className="underline" href="/sign-in">Sign in</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Right: Hero copy */}
        <div className="hidden md:flex items-center justify-center p-10">
          <div className="max-w-lg text-center text-white">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              The another galaxy is how far to us?
            </h2>
            <p className="mt-4 text-white/80">
              Collaborate in real-time on projects and issues. Keep your team aligned with comments, notifications, and live presence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}