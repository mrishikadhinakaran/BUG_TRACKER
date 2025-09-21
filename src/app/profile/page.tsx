"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient, useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : "";
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    if (!error) {
      if (typeof window !== 'undefined') localStorage.removeItem("bearer_token");
      refetch();
      router.push("/sign-in");
    }
  };

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Not authenticated</div>;

  const user = session.user as any;

  return (
    <div className="container mx-auto px-6 py-8 grid gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Manage your account</p>
        </div>
        <Button variant="secondary" onClick={handleSignOut}>Sign out</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Basic information</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="size-16 overflow-hidden rounded-full bg-muted">
            {user.image ? (
              <Image src={user.image} alt={user.name || user.email} width={64} height={64} />
            ) : (
              <Image src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop" alt="Avatar" width={64} height={64} />
            )}
          </div>
          <div className="grid">
            <div className="font-medium">{user.name || "Unnamed"}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            {user.role && <div className="text-sm">Role: <span className="capitalize">{user.role}</span></div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}