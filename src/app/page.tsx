"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop"
            alt="Team collaborating"
            fill
            priority
            className="object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Bug Tracker — collaborate like Teams, ship like pros</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Projects, issues, comments, and history — all in one place. Role-based access, powerful filters, and a clean UI.
            </p>
            <div className="mt-8 flex gap-3">
              <Button asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/register">Create an account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/api-docs">API Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-20 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>Organize work with owners and members</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bugs</CardTitle>
            <CardDescription>Track, assign, and resolve issues fast</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/bugs">Go to Bugs</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Quick stats and recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}