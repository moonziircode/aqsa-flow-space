import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    const { error } =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "signup") {
      toast.success("Account created. You're now signed in.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl mb-2">🛰️</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AqsaSpace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to your workspace" : "Create your workspace account"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 bg-background border border-border rounded-md p-5">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-foreground/20"
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-foreground/20"
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <div className="text-xs text-center text-muted-foreground pt-1">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-foreground underline underline-offset-2">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have one?{" "}
                <button type="button" onClick={() => setMode("signin")} className="text-foreground underline underline-offset-2">
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}