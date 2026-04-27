import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { getCurrentUser, loginUser } from "../api/auth";
import { getApiErrorMessage } from "../api/client";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setTokens, setUser, clearAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: LoginForm) {
    try {
      setServerError(null);
      const tokens = await loginUser(values.email, values.password);
      setTokens(tokens);
      const user = await getCurrentUser();
      setUser(user);
      toast.success("Signed in");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      clearAuth();
      const message = getApiErrorMessage(error, "Login failed");
      setServerError(message);
      toast.error(message);
    }
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Sign in</h1>
              <p className="text-sm text-muted-foreground">Use your task manager account</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {serverError ? (
            <Alert className="mb-4" title="Login failed">
              {serverError}
            </Alert>
          ) : null}
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="label" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email ? <p className="field-error">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="field-error">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link className="font-medium text-primary hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
