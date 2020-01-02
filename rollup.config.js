import path from "path";
import ts from "@wessberg/rollup-plugin-ts";
import {terser} from "rollup-plugin-terser";
import * as pkg from "./package.json"

async function main() {
    const commonPlugins = [];
    const tsOpts = {browserslist: false};
    const sourcemap = true;
    const results = [];

    const {main, bundle, bundleInput, bundleOutput, bundleNoExports, standalone, namespace} = pkg;
    const basePath = __dirname;
    const input = path.join(basePath, "src/index.ts");

    const freeze = false;
    let plugins = [...commonPlugins, ts({
        ...tsOpts,
        tsconfig: path.join(basePath, "tsconfig.json")
    })];

    results.push({
        input,
        output: [
            {
                file: path.join(basePath, main),
                format: "cjs",
                freeze,
                sourcemap,
            }
        ],
        plugins
    });

    if (bundle) {
        const input = path.join(basePath, bundleInput || "src/index.ts");
        const file = path.join(basePath, bundle);
        const ns = namespace || "game";
        const name = pkg.name.replace(/[^a-z]+/g, "_");
        let banner;
        let footer;

        if (!standalone) {
            if (bundleNoExports !== true) {
                footer = `Object.assign(this.${ns}, ${name});`;
            }
            if (ns.includes(".")) {
                const base = ns.split(".")[0];
                banner = `this.${base} = this.${base} || {};\n`;
            }
            banner = (banner || "") + `this.${ns} = this.${ns} || {};`;
        }

        results.push({
            input,
            output: Object.assign({
                banner,
                file,
                format: "iife",
                freeze,
                name,
                footer,
                sourcemap,
            }, bundleOutput),
            treeshake: false,
            plugins
        });

        if (process.env.NODE_ENV === "production") {
            results.push({
                input,
                output: Object.assign({
                    banner,
                    file: file.replace(/\.js$/, ".min.js"),
                    format: "iife",
                    freeze,
                    name,
                    footer,
                    sourcemap,
                }, bundleOutput),
                treeshake: false,
                plugins: [...plugins, terser()],
            });
        }
    }

    return results;
}

export default main();
