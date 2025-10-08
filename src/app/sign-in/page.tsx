"use client";
import { Suspense } from "react";
import SignInForm from "@/components/auth/sign-in-form";

function SignInPageContent() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}

export default function SignInPage() {
  return <SignInPageContent />;
}