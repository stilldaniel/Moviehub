"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import { MailCheck } from "lucide-react";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        // Without this, confirmation links go to the Supabase "Site URL", which may not be this site
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <EmptyState
          icon={<MailCheck size={24} />}
          title="Check your email"
          description={`We sent a confirmation link to ${email}. Open it to finish creating your account.`}
          action={<Button href="/auth/login" variant="secondary">Back to sign in</Button>}
        />
      </div>
    );
  }

  return (
    <AuthLayout
      subtitle="Create your account"
      onGoogle={handleGoogleSignup}
      googleLabel="Sign up with Google"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-brand hover:text-danger">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <Input type="text" name="name" autoComplete="name" placeholder="Full name" aria-label="Full name"
          icon={<FaUser size={14} />} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="email" name="email" autoComplete="email" placeholder="Email address" aria-label="Email address"
          icon={<FaEnvelope size={14} />} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" name="password" autoComplete="new-password" placeholder="Password (min 6 characters)" aria-label="Password"
          icon={<FaLock size={14} />} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
