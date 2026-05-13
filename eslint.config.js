import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,   // strict + type-aware
  tseslint.configs.stylisticTypeChecked, // consistencia estilística
  unicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error", 
      "@typescript-eslint/consistent-type-imports": "error",
      "unicorn/no-null": "off",
      "@typescript-eslint/no-unnecessary-condition": "off","unicorn/prevent-abbreviations": "off",
      "unicorn/prevent-abbreviations": "warn",
      "unicorn/no-process-exit": "warn",
      "unicorn/filename-case": "off","unicorn/no-await-expression-member": "off",
      "unicorn/prefer-module": "error","unicorn/prevent-abbreviations": ["error", {
  replacements: {
    db:false,
    mod: false
  }
}]
    },
  },
);