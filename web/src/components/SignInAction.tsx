"use client";

import { SignInButton } from "@clerk/nextjs";

type SignInActionProps = {
  label?: string;
};

export default function SignInAction({ label = "Sign in" }: SignInActionProps) {
  return (
    <SignInButton mode="modal">
      <button type="button">{label}</button>
    </SignInButton>
  );
}
