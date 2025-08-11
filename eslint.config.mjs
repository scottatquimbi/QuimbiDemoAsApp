import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Using the new flat config format
export default [
  ...compat.config({
    extends: ["next", "next/typescript", "next/core-web-vitals"]
  }),
];
