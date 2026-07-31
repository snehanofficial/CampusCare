// In-memory Auth Store singleton for non-React files (e.g. Axios interceptors)
let accessToken: string | null = null;

export const authStore = {
  getAccessToken: (): string | null => accessToken,
  setAccessToken: (token: string | null): void => {
    accessToken = token;
  },
  clearTokens: (): void => {
    accessToken = null;
  },
};
