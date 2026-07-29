// The modules ship to the browser as they are, so a stale reference or a typo
// only surfaces when that code path runs; linting every file is the safety net
// a build step would otherwise provide.
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/"] },
  js.configs.recommended,
  {
    files: ["js/**/*.js", "exhibits/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: globals.browser,
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: globals.node,
    },
  },
];
