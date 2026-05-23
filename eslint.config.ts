import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import functional from "eslint-plugin-functional";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["node_modules/", "dist/", "build/", "coverage/"]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  functional.configs.recommended,
  {
    name: "https://github.com/eslint-functional/eslint-plugin-functional#external-recommended-rules",
    rules: {
      "no-var": "error",
      "no-param-reassign": "error",
      "prefer-const": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    name: "no magic numbers",
    rules: {
      "@typescript-eslint/no-magic-numbers": "error",
    },
  },
  {
    name: "no type assertions",
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },
  eslintConfigPrettier,
);
