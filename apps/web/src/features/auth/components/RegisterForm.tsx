import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { registerSchema, type RegisterInput } from "@campuscare/shared-schemas";
import { useRegister } from "../hooks/useRegister.js";
import { FormField } from "../../../components/forms/FormField.js";
import { Loader2 } from "lucide-react";
import type { AppError } from "../../../lib/errors.js";
import { toast } from "sonner";

export function RegisterForm() {
  const navigate = useNavigate();
  const { mutateAsync: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data);
      toast.success("Account created successfully! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      const apiError = err as AppError;
      if (apiError.code === "EMAIL_ALREADY_EXISTS" || apiError.message?.includes("email")) {
        setError("email", { message: "Email is already registered" });
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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" error={errors.firstName?.message} required>
          <input
            type="text"
            placeholder="Jane"
            {...register("firstName")}
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>

        <FormField label="Last Name" error={errors.lastName?.message} required>
          <input
            type="text"
            placeholder="Doe"
            {...register("lastName")}
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>
      </div>

      <FormField label="Email Address" error={errors.email?.message} required>
        <input
          type="email"
          placeholder="jane.doe@campus.edu"
          {...register("email")}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <FormField
        label="Password"
        error={errors.password?.message}
        hint="Must be at least 8 chars, containing 1 uppercase letter and 1 number"
        required
      >
        <input
          type="password"
          placeholder="••••••••"
          {...register("password")}
          disabled={isPending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormField>

      <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
        <input
          type="password"
          placeholder="••••••••"
          {...register("confirmPassword")}
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
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}
export default RegisterForm;
