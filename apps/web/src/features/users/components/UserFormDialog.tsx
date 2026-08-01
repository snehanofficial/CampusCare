import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog.js";
import { Button } from "../../../components/ui/button.js";
import { FormField } from "../../../components/forms/FormField.js";
import { userRepository } from "../../../lib/repositories/user.repository.js";
import { roleRepository } from "../../../lib/repositories/role.repository.js";
import { departmentRepository } from "../../../lib/repositories/department.repository.js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const userFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  roleId: z.string().min(1, "Role is required"),
  departmentId: z.string().nullable().optional().or(z.literal("")),
  phone: z.string().max(20).optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
  password: z.string().optional(),
});

type UserFormInput = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null; // null means Create mode, string means Edit mode
  onSuccess: () => void;
}

export function UserFormDialog({ isOpen, onClose, userId, onSuccess }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!userId;

  // 1. Query Roles and Departments for dropdowns
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleRepository.list(),
    enabled: isOpen,
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentRepository.list(),
    enabled: isOpen,
  });

  // 2. Query User data for edit mode
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => userRepository.get(userId!),
    enabled: isOpen && isEditMode,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleId: "",
      departmentId: "",
      phone: "",
      isActive: true,
      password: "",
    },
  });

  // 3. Reset form when user data loads or mode changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && userData && rolesData) {
        // Find matching roleId from role name returned by backend
        const resolvedRole = rolesData.data.find(r => r.name === userData.role);
        reset({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleId: resolvedRole?.id || "",
          departmentId: userData.departmentId || "",
          phone: userData.phone || "",
          isActive: userData.status === "ACTIVE",
          password: "", // password remains empty unless changing it
        });
      } else if (!isEditMode) {
        reset({
          email: "",
          firstName: "",
          lastName: "",
          roleId: "",
          departmentId: "",
          phone: "",
          isActive: true,
          password: "",
        });
      }
    }
  }, [isOpen, userId, userData, rolesData, reset, isEditMode]);

  // 4. Mutation for Creating / Updating User
  const saveUserMutation = useMutation({
    mutationFn: async (data: UserFormInput) => {
      // Map empty string values back to null for API
      const payload = {
        ...data,
        departmentId: data.departmentId === "" ? null : data.departmentId,
        phone: data.phone === "" ? null : data.phone,
        password: data.password === "" ? undefined : data.password,
      };

      if (isEditMode) {
        return userRepository.update(userId!, payload as any);
      } else {
        return userRepository.create(payload as any);
      }
    },
    onSuccess: (data) => {
      toast.success(isEditMode ? "User updated successfully." : "User created successfully.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save user details.");
    },
  });

  const onSubmit = (data: UserFormInput) => {
    saveUserMutation.mutate(data);
  };

  const roles = rolesData?.data || [];
  const departments = deptsData?.data || [];
  const isSaving = saveUserMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modify User Account" : "Add User Account"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update user demographics, reassign access control roles, or toggle account status."
              : "Register a new user identity in the system with predefined security scopes."}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingUser ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.firstName?.message} required>
                <input
                  type="text"
                  placeholder="Jane"
                  {...register("firstName")}
                  disabled={isSaving}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                />
              </FormField>

              <FormField label="Last Name" error={errors.lastName?.message} required>
                <input
                  type="text"
                  placeholder="Doe"
                  {...register("lastName")}
                  disabled={isSaving}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                />
              </FormField>
            </div>

            <FormField label="Email Address" error={errors.email?.message} required>
              <input
                type="email"
                placeholder="jane.doe@campuscare.edu"
                {...register("email")}
                disabled={isSaving}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
            </FormField>

            <FormField label="Phone Number" error={errors.phone?.message}>
              <input
                type="tel"
                placeholder="+1 (555) 019-2834"
                {...register("phone")}
                disabled={isSaving}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="System Role" error={errors.roleId?.message} required>
                <select
                  {...register("roleId")}
                  disabled={isSaving}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  <option value="">Select Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Department" error={errors.departmentId?.message}>
                <select
                  {...register("departmentId")}
                  disabled={isSaving}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  <option value="">No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField
              label={isEditMode ? "Change Password (Optional)" : "Password (Optional)"}
              error={errors.password?.message}
              hint="Must be at least 8 characters with 1 uppercase letter and 1 number"
            >
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isSaving}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              />
            </FormField>

            {isEditMode && (
              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  disabled={isSaving}
                  className="size-4 rounded-sm border-gray-300 text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-foreground uppercase tracking-wider select-none cursor-pointer">
                  Account Enabled / Active
                </label>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 size-3 animate-spin" />}
                {isEditMode ? "Save Changes" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default UserFormDialog;
