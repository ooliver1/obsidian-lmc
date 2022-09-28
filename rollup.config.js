import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
    input: "main.ts",
    output: {
        dir: ".",
        sourcemap: "inline",
        compact: true,
        format: "cjs",
        exports: "default",
        banner: "// SPDX-License-Identifier: MIT\n// Copyright (c) 2022-latest ooliver1",
    },
    external: ["obsidian"],
    plugins: [
        typescript(),
        nodeResolve({ browser: true }),
        commonjs(),
        terser({
            output: {
                comments: function (node, comment) {
                    var text = comment.value;
                    var type = comment.type;
                    if (type == "comment1") {
                        // multiline comment
                        return /SPDX|Copyright/i.test(text);
                    }
                },
            },
        }),
    ],
};
