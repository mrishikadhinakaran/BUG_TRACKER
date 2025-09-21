"use client";
import { useEffect, useMemo, useState } from "react";
import { useBugs, useCreateBug, useUpdateBug } from "@/lib/hooks/useBugTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;
const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export default function BugsPage() {
  const [filters, setFilters] = useState({ page: 1, pageSize: 10, status: "", priority: "", projectId: "", assigneeId: "", search: "" });
  const { data, loading } = useBugs({
    page: filters.page,
    pageSize: filters.pageSize,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    projectId: filters.projectId ? Number(filters.projectId) : undefined,
    assigneeId: filters.assigneeId ? Number(filters.assigneeId) : undefined,
    search: filters.search || undefined,
  });
  const { mutate: createBug, loading: creating, error: createError } = useCreateBug();
  const { mutate: updateBug, loading: updating } = useUpdateBug();

  const rows = useMemo(() => data?.data ?? [], [data]);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [reporterId, setReporterId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("medium");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("open");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBug("/api/bugs", {
      projectId: Number(projectId || 1),
      title,
      description,
      priority,
      status,
      reporterId: Number(reporterId || 1),
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
    });
    setTitle("");
    setDescription("");
    setProjectId("");
    setReporterId("");
    setAssigneeId("");
    setPriority("medium");
    setStatus("open");
    // naive refresh
    window.location.reload();
  };

  const handleStatusChange = async (bugId: number, newStatus: (typeof STATUSES)[number]) => {
    await updateBug(`/api/bugs?id=${bugId}`, { status: newStatus });
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-6 py-8 grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Bugs</h1>
        <p className="text-muted-foreground">Report, assign, and resolve issues</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and narrow down results</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-5">
          <div className="grid gap-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Title or description" />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={filters.status || undefined as any} onValueChange={(v) => setFilters((f) => ({ ...f, status: v.startsWith("any-") ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any-status">Any</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Priority</Label>
            <Select value={filters.priority || undefined as any} onValueChange={(v) => setFilters((f) => ({ ...f, priority: v.startsWith("any-") ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any-priority">Any</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input id="projectId" value={filters.projectId} onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))} placeholder="e.g. 1" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assigneeId">Assignee ID</Label>
            <Input id="assigneeId" value={filters.assigneeId} onChange={(e) => setFilters((f) => ({ ...f, assigneeId: e.target.value }))} placeholder="e.g. 2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report a Bug</CardTitle>
          <CardDescription>Provide details to help resolve it quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project">Project ID</Label>
              <Input id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="e.g. 1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reporter">Reporter ID</Label>
              <Input id="reporter" value={reporterId} onChange={(e) => setReporterId(e.target.value)} placeholder="e.g. 1" />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="assignee">Assignee ID (optional)</Label>
              <Input id="assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} placeholder="e.g. 2" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Bug"}</Button>
              {createError && <p className="text-sm text-destructive mt-2">{createError}</p>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bugs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
                ) : rows.length ? (
                  rows.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.id}</TableCell>
                      <TableCell>{b.title}</TableCell>
                      <TableCell>{b.project?.key ?? b.projectId}</TableCell>
                      <TableCell className="capitalize">{b.priority}</TableCell>
                      <TableCell>
                        <Select value={b.status} onValueChange={(v) => handleStatusChange(b.id, v as any)}>
                          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={`${b.id}-${s}`} value={s}>{s.replace("_", " ")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{b.assigneeId ?? "-"}</TableCell>
                      <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={7}>No bugs found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}