import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth.js";
import type { LoginInput } from "@campuscare/shared-schemas";

export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      await login(credentials);
    },
  });
}
