import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier/flat";
import { importX } from "eslint-plugin-import-x";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

type Config = Parameters<typeof defineConfig>[number];

const MAX_DEPTH = 3;

const TEST_FILES = "tests/specs/**/*.spec.ts";

const RELATIVE_IMPORTS = {
  regex: String.raw`^\.\.?/`,
  message: 'Import with the "#/" alias, e.g. "#/src/module.ts".',
};

const TEST_FRAMEWORK_IMPORTS = {
  name: "node:test",
  message: `Put tests in ${TEST_FILES}, so that \`npm test\` runs them.`,
};

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
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      eqeqeq: "error",
    },
  },
  {
    name: "node-test",
    rules: {
      "@typescript-eslint/no-floating-promises": [
        "error",
        {
          allowForKnownSafeCalls: [
            { from: "package", package: "node:test", name: ["describe", "it"] },
          ],
        },
      ],
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
  {
    name: "consistent-imports",
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [TEST_FRAMEWORK_IMPORTS], patterns: [RELATIVE_IMPORTS] },
      ],
    },
  },
  {
    name: "test-location",
    files: [TEST_FILES],
    rules: {
      "no-restricted-imports": ["error", { patterns: [RELATIVE_IMPORTS] }],
    },
  },
];

const stylisticConfigs: Config[] = [
  tseslint.configs.stylisticTypeChecked,
  {
    name: "clean-imports",
    rules: {
      "import-x/no-duplicates": "error",
      "import-x/no-useless-path-segments": "error",
    },
  },
  {
    name: "limit-mutations",
    rules: {
      "@typescript-eslint/prefer-readonly": "error",
      "no-param-reassign": ["error", { props: true }],
      "no-var": "error",
      "prefer-const": "error",
    },
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
