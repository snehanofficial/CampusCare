import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router";
import { loginSchema, type LoginInput } from "@campuscare/shared-schemas";
import { useLogin } from "../hooks/useLogin.js";
import { FormField } from "../../../components/forms/FormField.js";
import { Loader2 } from "lucide-react";
import type { AppError } from "../../../lib/errors.js";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mutateAsync: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  // Redirect back to request route or fallback to dashboard
  const from = (location.state as any)?.from?.pathname ?? "/dashboard";

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      const apiError = err as AppError;
      if (apiError.code === "UNAUTHORIZED" || apiError.code === "INVALID_CREDENTIALS") {
        setError("email", { message: "Invalid email or password" });
        setError("password", { message: "Invalid email or password" });
      } else {
        setError("root", { message: apiError.message || "An unexpected error occurred" });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root && (
        <div className="rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
          {errors.root.message}
        </div>
      )}

      <FormField label="Email Address" error={errors.email?.message} required>
        <input
          type="email"
          placeholder="admin@campuscare.edu"
          {...register("email")}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message} required>
        <input
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
export default LoginForm;
