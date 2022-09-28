import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: "main.ts",
    output: {
        dir: ".",
        sourcemap: "inline",
        format: "cjs",
        exports: "default",
        banner: "// SPDX-License-Identifier: MIT\n// Copyright (c) 2022-latest ooliver1",
    },
    external: ["obsidian"],
    plugins: [typescript(), nodeResolve({ browser: true }), commonjs()],
};
