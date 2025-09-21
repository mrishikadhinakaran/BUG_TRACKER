"use client";
import { useEffect, useMemo, useState } from "react";
import { useProjects, useCreateProject } from "@/lib/hooks/useBugTracker";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const { data, loading } = useProjects(page, pageSize);
  const { mutate: createProject, loading: creating, error } = useCreateProject();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<number | "">(1);

  const rows = useMemo(() => data?.data ?? [], [data]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject("/api/projects", {
      name,
      key: key.toUpperCase(),
      description,
      ownerId: Number(ownerId) || 1,
    });
    setName("");
    setKey("");
    setDescription("");
    // naive refresh
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-6 py-8 grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground">Create and manage your projects</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>Provide a short uppercase key (e.g., APP)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} required />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Project"}</Button>
            </div>
            {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                ) : rows.length ? (
                  rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.key}</TableCell>
                      <TableCell className="capitalize">{p.status}</TableCell>
                      <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5}>No projects yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}