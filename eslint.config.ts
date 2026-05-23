import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import functional from "eslint-plugin-functional";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

type Config = Parameters<typeof defineConfig>[number];

const infrastructureConfigs: Config[] = [
  globalIgnores(["node_modules/", "dist/", "build/", "coverage/"]),
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
];

const baselineConfigs: Config[] = [
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    name: "no-type-assertions",
    rules: {
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },
];

const policyConfigs: Config[] = [
  functional.configs.recommended,
  functional.configs.stylistic,
  // https://github.com/eslint-functional/eslint-plugin-functional#external-recommended-rules
  {
    name: "functional-plugin-companion-rules",
    rules: {
      "no-var": "error",
      "no-param-reassign": "error",
      "prefer-const": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    name: "no-magic-numbers",
    rules: {
      "@typescript-eslint/no-magic-numbers": "error",
    },
  },
];

export default defineConfig(
  ...infrastructureConfigs,
  ...baselineConfigs,
  ...policyConfigs,
  prettierConfig,
);
