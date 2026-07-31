// ESLint Flat Configuration File
import js from "@eslint/js";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/pwa/**",
      "**/storage/**",
      "packages/eslint-config/**"
    ]
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "no-undef": "off"
    }
  }
];
