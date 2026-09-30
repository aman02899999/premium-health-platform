import { redirect } from "next/navigation";
import { adminPassword, isAdmin, usingDevPassword } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { BrandMark } from "@/components/ui/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="glass gold-border w-full max-w-sm rounded-3xl p-8">
        <div className="flex justify-center">
          <BrandMark className="h-14" />
        </div>
        <h1 className="font-display mt-4 text-center text-3xl text-white">Admin login</h1>
        {!adminPassword() ? (
          <p className="mt-6 rounded-xl bg-red-500/15 p-4 text-sm text-red-200">
            Admin is disabled. Set the <code>ADMIN_PASSWORD</code> environment variable on your host and redeploy.
          </p>
        ) : (
          <>
            {usingDevPassword() && (
              <p className="mt-4 rounded-xl bg-yellow-500/15 p-3 text-xs text-yellow-100">
                Development mode: password is <code>royal-admin</code>. Set ADMIN_PASSWORD in production.
              </p>
            )}
            <LoginForm />
          </>
        )}
      </div>
    </main>
  );
}
