import { redirect } from "next/navigation";
import { adminPassword, currentUser, isAdmin, usingDevPassword } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "@/components/admin/LoginForm";
import { GoogleSignIn, SignOutButton } from "@/components/auth/AuthButtons";
import { BrandMark } from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const user = await currentUser();

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass brand-border w-full max-w-sm rounded-3xl p-8">
        <div className="flex justify-center">
          <BrandMark className="h-14" />
        </div>
        <h1 className="font-display mt-4 text-center text-3xl text-white">Admin login</h1>
        {supabaseConfigured ? (
          user ? (
            <div className="mt-6 space-y-4 text-center">
              <p className="rounded-xl bg-ember/15 p-4 text-sm text-red-200">
                <strong className="block text-white">{user.email}</strong>
                is signed in but isn&apos;t an admin of this site.
              </p>
              <SignOutButton next="/admin/login" label="Use a different Google account" />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <GoogleSignIn next="/admin" label="Sign in with Google" />
              <p className="text-center text-xs text-white/45">Only Google accounts on the admin list can edit the site.</p>
            </div>
          )
        ) : !adminPassword() ? (
          <p className="mt-6 rounded-xl bg-red-500/15 p-4 text-sm text-red-200">
            Admin is disabled. Configure Supabase (see README) or set <code>ADMIN_PASSWORD</code> for local use.
          </p>
        ) : (
          <>
            {usingDevPassword() && (
              <p className="mt-4 rounded-xl bg-yellow-500/15 p-3 text-xs text-yellow-100">
                Development mode: password is <code>royal-admin</code>. Production uses Google sign-in via Supabase.
              </p>
            )}
            <LoginForm />
          </>
        )}
      </div>
    </main>
  );
}
