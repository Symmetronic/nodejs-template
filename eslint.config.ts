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

const functionalLiteNoMutationsRules = Object.fromEntries(
  Object.entries(functional.configs.lite.rules ?? {}).filter(
    ([name]) => name in (functional.configs.noMutations.rules ?? {}),
  ),
);

const policyConfigs: Config[] = [
  functional.configs.externalTypeScriptRecommended,
  functional.configs.stylistic,
  {
    name: "functional-lite-no-mutations",
    plugins: { functional },
    rules: functionalLiteNoMutationsRules,
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
