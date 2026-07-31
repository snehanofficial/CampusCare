import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api.js";
import type { RegisterInput } from "@campuscare/shared-schemas";

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      return await authApi.register(data);
    },
  });
}
