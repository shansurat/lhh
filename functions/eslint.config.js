const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: ["lib/**/*", "generated/**/*"],
  },
  {
    files: ["src/**/*.js", "src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.dev.json"],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    rules: {
      quotes: ["error", "double"],
      "import/no-unresolved": 0,
      indent: ["error", 2],
    },
  },
  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
    },
  },
];
