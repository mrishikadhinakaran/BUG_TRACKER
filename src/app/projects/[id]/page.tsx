"use client";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { useProject, useProjectMembers, useAddProjectMember, useRemoveProjectMember, useUsers } from "@/lib/hooks/useBugTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MEMBER_ROLES = ["owner","maintainer","contributor","viewer"] as const;

export default function ProjectDetailPage() {
  const params = useParams();
  const idStr = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const projectId = Number(idStr);

  const { data: projectData, loading: projectLoading } = useProject(projectId);
  const { data: membersData, loading: membersLoading } = useProjectMembers(projectId);
  const { data: usersPaged } = useUsers(1, 50);
  const allUsers = usersPaged?.data ?? [];

  const { mutate: addMember, loading: adding, error: addError } = useAddProjectMember();
  const { mutate: removeMember, loading: removing } = useRemoveProjectMember();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [role, setRole] = useState<(typeof MEMBER_ROLES)[number]>("contributor");

  const members = useMemo(() => membersData ?? [], [membersData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await addMember(`/api/projects/${projectId}/members`, { userId: Number(selectedUserId), role });
    window.location.reload();
  };

  const handleRemove = async (userId: number) => {
    await removeMember(`/api/projects/${projectId}/members`, { userId });
    window.location.reload();
  };

  if (Number.isNaN(projectId)) return <div className="p-6">Invalid project</div>;

  return (
    <div className="container mx-auto px-6 py-8 grid gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project</h1>
          <p className="text-muted-foreground">Manage members and settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          {projectLoading ? (
            <div>Loading...</div>
          ) : projectData ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Name: </span>{projectData.name}</div>
              <div><span className="text-muted-foreground">Key: </span>{projectData.key}</div>
              <div className="sm:col-span-2"><span className="text-muted-foreground">Description: </span>{projectData.description || "—"}</div>
              <div><span className="text-muted-foreground">Status: </span><span className="capitalize">{projectData.status}</span></div>
              <div><span className="text-muted-foreground">Owner ID: </span>{projectData.ownerId}</div>
            </div>
          ) : (
            <div>Project not found</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Add or remove team members</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>User</Label>
              <Select value={selectedUserId} onValueChange={(v) => setSelectedUserId(v)}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={`u-${u.id}`} value={`${u.id}`}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((r) => (
                    <SelectItem key={`r-${r}`} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="self-end">
              <Button type="submit" disabled={adding || !selectedUserId}>{adding ? "Adding..." : "Add Member"}</Button>
            </div>
            {addError && <p className="text-sm text-destructive sm:col-span-3">{addError}</p>}
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membersLoading ? (
                  <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
                ) : members.length ? (
                  members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.user.name} ({m.user.email})</TableCell>
                      <TableCell className="capitalize">{m.role}</TableCell>
                      <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" onClick={() => handleRemove(m.userId)} disabled={removing}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4}>No members</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}