"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOut() {
  const router = useRouter();
  return (
    <button className="hover:text-stone-900" onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }}>
      Sign out
    </button>
  );
}
