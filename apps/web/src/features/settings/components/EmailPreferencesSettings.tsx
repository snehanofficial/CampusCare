import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emailPreferenceRepository } from "../../../lib/repositories/email-preference.repository.js";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "../../../components/ui/switch.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { toast } from "sonner";
import { Mail, Loader2, Save } from "lucide-react";

// 1. Configure Zod schema validation
const emailPreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      event: z.string(),
      label: z.string(),
      enabled: z.boolean(),
    })
  ),
});

type EmailPreferencesFormValues = z.infer<typeof emailPreferencesSchema>;

export function EmailPreferencesSettings() {
  const queryClient = useQueryClient();

  // 2. Query setting variables using TanStack Query
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["email-preferences"],
    queryFn: () => emailPreferenceRepository.getPreferences(),
  });

  // 3. React Hook Form initializer
  const { handleSubmit, control, reset, formState: { isDirty } } = useForm<EmailPreferencesFormValues>({
    resolver: zodResolver(emailPreferencesSchema),
    defaultValues: {
      preferences: [],
    },
  });

  // Hydrate form default values when query resolves
  useEffect(() => {
    if (preferences) {
      reset({ preferences });
    }
  }, [preferences, reset]);

  // 4. Update mutation hook
  const mutation = useMutation({
    mutationFn: (updates: Array<{ eventType: string; enabled: boolean }>) =>
      emailPreferenceRepository.updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast.success("Email preference configurations updated successfully.");
    },
    onError: (err: any) => {
      toast.error(`Failed to update preferences: ${err.message || err}`);
    },
  });

  const onSubmit = (data: EmailPreferencesFormValues) => {
    const formatted = data.preferences.map((p) => ({
      eventType: p.event,
      enabled: p.enabled,
    }));
    mutation.mutate(formatted);
  };

  if (isLoading) {
    return <div className="text-xs text-muted-foreground p-6">Loading email preferences matrix...</div>;
  }

  if (error) {
    return (
      <div className="text-xs text-destructive p-6 font-semibold">
        Error loading preferences: {error.message}
      </div>
    );
  }

  return (
    <Card className="border border-border bg-card">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className="border-b border-border/40 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Email Delivery Preferences</CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
                Configure which transactional system events trigger direct email warnings.
              </CardDescription>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !isDirty}
              className="text-xs font-bold gap-1.5 cursor-pointer"
            >
              {mutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Save className="size-3" />
              )}
              Save Preferences
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="text-[10px] font-bold text-muted-foreground uppercase p-4">Action</th>
                  <th className="text-[10px] font-bold text-muted-foreground uppercase p-4 text-center w-24">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="size-3 text-muted-foreground" />
                      <span>Email Enabled</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {preferences?.map((item, index) => (
                  <tr key={item.event} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4">
                      <span className="text-xs font-semibold text-foreground">
                        {item.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Controller
                          name={`preferences.${index}.enabled`}
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={mutation.isPending}
                            />
                          )}
                        />
                        {/* Hidden controller for index tracking schema match */}
                        <Controller
                          name={`preferences.${index}.event`}
                          control={control}
                          render={({ field }) => <input type="hidden" {...field} />}
                        />
                        <Controller
                          name={`preferences.${index}.label`}
                          control={control}
                          render={({ field }) => <input type="hidden" {...field} />}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
export default EmailPreferencesSettings;
