import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { getCurrentUser, loginUser, registerUser } from "../api/auth";
import { getApiErrorMessage } from "../api/client";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";

const schema = z
  .object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setTokens, setUser, clearAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", confirmPassword: "" },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: RegisterForm) {
    try {
      setServerError(null);
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      });
      const tokens = await loginUser(values.email, values.password);
      setTokens(tokens);
      const user = await getCurrentUser();
      setUser(user);
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      clearAuth();
      const message = getApiErrorMessage(error, "Registration failed");
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
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Create account</h1>
              <p className="text-sm text-muted-foreground">Start managing projects and tasks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {serverError ? (
            <Alert className="mb-4" title="Registration failed">
              {serverError}
            </Alert>
          ) : null}
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="label" htmlFor="full_name">
                Full name
              </label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name ? (
                <p className="field-error">{form.formState.errors.full_name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="email">
                Email
              </label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email ? <p className="field-error">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="field-error">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword ? (
                <p className="field-error">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
