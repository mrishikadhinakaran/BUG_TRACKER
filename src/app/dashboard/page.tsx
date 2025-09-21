"use client";
import Link from "next/link";
import { useBugTrackerStats } from "@/lib/hooks/useBugTracker";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const stats = useBugTrackerStats();

  return (
    <div className="container mx-auto px-6 py-8 grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your workspace</p>
        </div>
        <div className="flex gap-2">
          <Button asChild><Link href="/projects">Projects</Link></Button>
          <Button asChild variant="secondary"><Link href="/bugs">Bugs</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Total Bugs" value={stats.totalBugs} />
        <Stat title="Open Bugs" value={stats.openBugs} />
        <Stat title="Projects" value={stats.totalProjects} />
        <Stat title="Users" value={stats.totalUsers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
          <CardDescription>Create a project and file your first bug</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link href="/projects">Create Project</Link></Button>
          <Button asChild variant="outline"><Link href="/bugs">Report Bug</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <div className="text-3xl font-bold">{value}</div>
      </CardHeader>
    </Card>
  );
}