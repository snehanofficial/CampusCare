# FORM_VALIDATION.md
## CampusCare — Form Validation Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** React Hook Form v7 · Zod v4 · `@hookform/resolvers` · Shared Schemas Package

---

## 1. Purpose

This document defines the form validation strategy for CampusCare. All forms use React Hook Form for state management and Zod for schema-based validation. Validation schemas are defined once in `packages/shared-schemas` and consumed by both the frontend (React Hook Form) and the backend (Express middleware).

---

## 2. Architecture

```
Form Component
     │
     ▼
React Hook Form (useForm)
     │  register, handleSubmit, formState
     │
     ▼
Zod Resolver (@hookform/resolvers/zod)
     │  Validates on submit + optional onBlur
     │
     ▼
Shared Schema (packages/shared-schemas/src/*.ts)
     │  z.object({ ... }) — Single source of truth
     │
     ├─ Used by Frontend: React Hook Form validation
     └─ Used by Backend: Express route validation (via .parse())
```

---

## 3. Zod v4 — Key Changes from v3

**Our project uses Zod v4 (`zod@4.4.3`).** These are breaking changes from v3:

### Import Change
```typescript
// Zod v3
import { z } from "zod";

// Zod v4 (same import, but namespace access changed for some utilities)
import { z } from "zod";           // Core schemas — SAME
import * as z from "zod/v4";       // If using v4-specific APIs (rare)
```

### Error Formatting
```typescript
// Zod v3
schema.safeParse(data).error?.flatten()

// Zod v4 — same API, but error paths improved for nested objects
schema.safeParse(data).error?.flatten()

// Zod v4 NEW: z.prettifyError() for human-readable errors
import { prettifyError } from "zod/v4";
const error = schema.safeParse(data).error;
if (error) console.log(prettifyError(error));
```

### Discriminated Unions (improved)
```typescript
// Zod v4 — better inference for discriminated unions
const TicketStatus = z.discriminatedUnion("status", [
  z.object({ status: z.literal("OPEN"), assigneeId: z.null() }),
  z.object({ status: z.literal("ASSIGNED"), assigneeId: z.string().uuid() }),
]);
```

---

## 4. Shared Schemas Package

All Zod schemas live in `packages/shared-schemas/src/`. They are the single source of truth for validation across the stack.

### Auth Schemas (`shared-schemas/src/auth.ts`)
```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type RegisterInput = z.infer<typeof registerSchema>;
```

### Ticket Schemas (`shared-schemas/src/ticket.ts`)
```typescript
export const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Please provide more detail").max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  categoryId: z.string().uuid("Please select a category"),
  departmentId: z.string().uuid("Please select a department"),
  assetId: z.string().uuid().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
```

---

## 5. Standard Form Pattern

### Form Component Template

```tsx
// features/auth/components/LoginForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@campuscare/shared-schemas";

export function LoginForm() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,  // For server-side errors
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",  // Validate on field blur (not on every keystroke)
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
    } catch (error: AppError) {
      // Map server errors back to specific form fields
      if (error.code === "INVALID_CREDENTIALS") {
        setError("email", { message: "Invalid email or password" });
        setError("password", { message: "Invalid email or password" });
      } else {
        // Non-field error — show toast
        toast.error(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField
        label="Email"
        error={errors.email?.message}
        required
      >
        <Input
          type="email"
          placeholder="user@campus.edu"
          {...register("email")}
          aria-invalid={!!errors.email}
        />
      </FormField>

      <FormField
        label="Password"
        error={errors.password?.message}
        required
      >
        <Input
          type="password"
          {...register("password")}
          aria-invalid={!!errors.password}
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <Spinner /> : "Sign In"}
      </Button>
    </form>
  );
}
```

---

## 6. `FormField` Component

A reusable wrapper that handles label, required indicator, and error display:

```tsx
// components/forms/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;   // Helper text below the input
  children: React.ReactNode;
}

export function FormField({ label, error, required, hint, children }: FormFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-label="required">*</span>
        )}
      </label>

      {React.cloneElement(children as React.ReactElement, { id })}

      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## 7. Validation Mode Decision

| Mode | Behavior | Use Case |
|:---|:---|:---|
| `onSubmit` (default) | Validates only on form submit | Simple forms, minimal distraction |
| `onBlur` | Validates when field loses focus | Multi-field forms (register, create ticket) |
| `onChange` | Validates on every keystroke | Real-time feedback (e.g., password strength) |
| `all` | `onChange` + `onBlur` | Complex forms with strong validation requirements |

**Our default:** `mode: "onBlur"` — validates when the user leaves a field. This provides feedback without overwhelming users while they type.

**Exception:** Password strength indicator uses `watch()` + a custom hook for real-time feedback without triggering validation errors mid-typing.

---

## 8. Multi-Step Forms

For complex forms (e.g., new asset registration with multiple steps):

```typescript
// Pattern: useForm at the top level, persist across steps via React state
const methods = useForm<CreateAssetInput>({
  resolver: zodResolver(createAssetSchema),
  mode: "onBlur",
});

// Step 1: Basic Info
// Step 2: Purchase Details
// Step 3: Assignment

// On final submit, call handleSubmit at the top level
// Each step validates its own fields using trigger():
const { trigger } = methods;
const isStep1Valid = await trigger(["name", "model", "tag"]);
if (isStep1Valid) nextStep();
```

---

## 9. Backend Validation Integration

The Express backend uses the same Zod schemas from `@campuscare/shared-schemas`:

```typescript
// middleware/validate.ts
import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: result.error.flatten().fieldErrors,
        },
      });
      return;
    }
    req.body = result.data; // Replace with parsed (and potentially coerced) data
    next();
  };
}

// Usage in routes:
router.post("/tickets", authenticate, validate(createTicketSchema), TicketController.create);
```

---

## 10. File Upload Validation

```typescript
// Schema for file input validation (client-side)
const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 10 * 1024 * 1024, "File must be under 10MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "application/pdf"].includes(f.type),
      "Only JPEG, PNG, and PDF files are allowed"
    ),
});
```

---

## 11. Server-Side Error Mapping

When the API returns field-level validation errors, they are mapped back to form fields:

```typescript
// Pattern for mapping server errors to form fields
const onSubmit = async (data: CreateTicketInput) => {
  try {
    await createTicket(data);
  } catch (error: AppError) {
    if (error.code === "VALIDATION_ERROR" && error.details) {
      // Map server field errors back to React Hook Form
      const fieldErrors = error.details as Record<string, string[]>;
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        setError(field as keyof CreateTicketInput, {
          message: messages[0],
        });
      });
    } else {
      toast.error(error.message);
    }
  }
};
```

---

## 12. Accessibility Requirements

- Every `<input>` has an associated `<label>` via `htmlFor`/`id`
- Error messages use `role="alert"` and `aria-live="polite"`
- Required fields are marked with `aria-required="true"` (via `required` prop)
- Invalid fields have `aria-invalid="true"`
- Error messages are linked via `aria-describedby`

```tsx
<input
  {...register("email")}
  id={id}
  aria-required={required}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? `${id}-error` : undefined}
/>
{errors.email && (
  <p id={`${id}-error`} role="alert" aria-live="polite">
    {errors.email.message}
  </p>
)}
```

---

## 13. Trade-offs

| Decision | Alternative | Rationale |
|:---|:---|:---|
| Zod for validation | Yup | Zod v4 is TypeScript-first, faster, better inference. Yup's API is less composable |
| Shared schemas | Duplicate schemas per layer | DRY: one schema → validated in both frontend and backend. No drift between layers |
| React Hook Form | Formik | RHF is uncontrolled by default (fewer re-renders), smaller bundle, better TypeScript |
| `mode: "onBlur"` | `mode: "onChange"` | Less re-render pressure; sufficient UX for enterprise forms |
