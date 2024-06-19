// @ts-check

import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default ts.config(
  { languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  { ignores: ["old/", "dist/"] },
);
