"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button, Field, Input } from "./ui";

export function LoginForm({ configured, demo }: { configured: boolean; demo: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get("error") === "not_admin" ? "This account doesn't have admin access. Ask the owner to add you to admin_users." : "");
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb) return;
    setBusy(true);
    setError("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message);
      setBusy(false);
      return;
    }
    const { data: isAdmin } = await sb.rpc("is_admin");
    if (!isAdmin) {
      await sb.auth.signOut();
      setError("This account doesn't have admin access. Ask the owner to add you to admin_users.");
      setBusy(false);
      return;
    }
    router.push(params.get("next") || "/admin");
    router.refresh();
  }

  async function reset() {
    const sb = getBrowserSupabase();
    if (!sb || !email) {
      setError("Enter your email first, then choose Forgot password.");
      return;
    }
    await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/settings` });
    setSent(true);
  }

  return (
    <div className="w-full max-w-sm">
      <Logo className="h-8 w-auto text-maroon" />
      <h1 className="mt-10 text-[1.9rem] font-extrabold tracking-tight [font-variation-settings:'wdth'_106]">Sign in to SNOOZ admin</h1>
      <p className="mt-2 text-charcoal/55">Manage leads, blogs and website content.</p>

      {!configured ? (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-5 text-sm text-charcoal/70">
          Supabase isn&apos;t connected yet, so there&apos;s nothing to sign in to.
          {demo ? (
            <Link href="/admin" className="mt-4 flex h-11 items-center justify-center rounded-xl bg-maroon font-semibold text-linen">Explore the demo panel</Link>
          ) : (
            <p className="mt-3">Add your Supabase keys to the environment and redeploy. See README.md.</p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-charcoal/50 hover:text-charcoal" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          {error && <p role="alert" className="rounded-xl bg-[#b4321f]/8 px-3.5 py-2.5 text-sm text-[#9a2a19]">{error}</p>}
          {sent && <p className="rounded-xl bg-[#e3f2e8] px-3.5 py-2.5 text-sm text-[#1f6b3a]">Check your inbox for a reset link.</p>}
          <Button type="submit" loading={busy} className="w-full">Sign in</Button>
          <button type="button" onClick={reset} className="w-full text-center text-sm font-medium text-charcoal/55 hover:text-maroon">Forgot password?</button>
        </form>
      )}
      <Link href="/" className="mt-12 inline-block text-sm text-charcoal/50 hover:text-charcoal">← Back to website</Link>
    </div>
  );
}
