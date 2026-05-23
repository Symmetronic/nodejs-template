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
  {
    name: "immutable data",
    plugins: { functional },
    rules: {
      "functional/immutable-data": "error",
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
