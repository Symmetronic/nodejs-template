import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import functional from "eslint-plugin-functional";
import { importX } from "eslint-plugin-import-x";
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
    linterOptions: {
      noInlineConfig: true,
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
  importX.flatConfigs.errors,
  importX.flatConfigs.typescript,
  {
    name: "clean-imports",
    rules: {
      "import-x/no-cycle": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-self-import": "error",
      "import-x/no-useless-path-segments": "error",
    },
  },
  {
    name: "no-debug-output",
    rules: {
      "no-alert": "error",
      // Add `"no-console": "error"` for frontend apps
      "no-debugger": "error",
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
    name: "no-mutations",
    rules: functionalLiteNoMutationsRules,
  },
  {
    name: "no-magic-numbers",
    rules: {
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [-1, 0, 1],
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
    },
  },
  {
    name: "explicit-contracts",
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
    },
  },
];

export default defineConfig(
  ...infrastructureConfigs,
  ...baselineConfigs,
  ...policyConfigs,
  prettierConfig,
);
