import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import visualizer from "rollup-plugin-visualizer";

export default {
  input: "lib/browser-runtime",
  output: {
    file: "dist/browser-runtime.js",
    format: "commonjs"
  },
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs(),
    json(),
    visualizer()
  ]
};
