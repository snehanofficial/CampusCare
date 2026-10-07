// ESLint Flat Configuration File
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/pwa/**",
      "**/storage/**",
      "**/coverage/**",
      "**/*.generated.*",
      "**/sw.js",
      "**/sw.mjs"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],
      "no-console": "off",
      "no-undef": "off"
    }
  }
);
