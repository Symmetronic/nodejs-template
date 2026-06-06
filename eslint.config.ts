import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import functional from "eslint-plugin-functional";
import { importX } from "eslint-plugin-import-x";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

type Config = Parameters<typeof defineConfig>[number];

const MAX_DEPTH = 3;

const recommendedConfigs: Config[] = [
  globalIgnores(
    ["node_modules/", "dist/", "build/", "coverage/"],
    "global-ignores",
  ),
  {
    name: "eslint-configuration",
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    linterOptions: {
      noInlineConfig: true,
    },
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    name: "safe-types",
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-check": true,
          "ts-expect-error": true,
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
      eqeqeq: "error",
    },
  },
  importX.flatConfigs.errors,
  importX.flatConfigs.typescript,
  {
    name: "correct-imports",
    rules: {
      "import-x/no-cycle": "error",
      "import-x/no-self-import": "error",
    },
  },
];

const liteSeverityNoMutationRules = Object.fromEntries(
  Object.entries(functional.configs.lite.rules ?? {}).filter(
    ([name]) => name in (functional.configs.noMutations.rules ?? {}),
  ),
);

const stylisticConfigs: Config[] = [
  tseslint.configs.stylisticTypeChecked,
  {
    name: "clean-imports",
    rules: {
      "import-x/no-duplicates": "error",
      "import-x/no-useless-path-segments": "error",
    },
  },
  functional.configs.externalTypeScriptRecommended,
  functional.configs.stylistic,
  {
    name: "no-mutations",
    rules: liteSeverityNoMutationRules,
  },
  {
    name: "no-debug-output",
    rules: {
      "no-alert": "error",
      // Remove `no-console` rule for backend apps
      "no-console": "error",
      "no-debugger": "error",
    },
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
    name: "readability",
    rules: {
      "max-depth": ["error", MAX_DEPTH],
      "no-else-return": "error",
      "no-nested-ternary": "error",
    },
  },
];

export default defineConfig(
  ...recommendedConfigs,
  ...stylisticConfigs,
  prettierConfig,
);
