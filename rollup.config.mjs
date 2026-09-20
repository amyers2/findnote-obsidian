import { builtinModules } from "module";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "main.ts",
  output: {
    dir: ".",
    sourcemap: "inline",
    format: "cjs",
    exports: "default",
  },
  external: [
    "obsidian",
    ...builtinModules,
  ],
  plugins: [
    resolve(),
    typescript(),
  ],
};
