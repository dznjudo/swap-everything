const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => ({
  mode: argv.mode || "production",

  // ── Entry: plugin logic only ────────────────────────────────
  // ui.html is copied as-is — no bundling needed since it's
  // self-contained HTML/CSS/JS in a single file.
  entry: {
    code: "./src/plugin/controller.ts",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },

  // ── Copy ui.html straight into dist/ ─────────────────────────
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/ui/ui.html", to: "ui.html" },
      ],
    }),
  ],

  // Source maps for development debugging
  devtool: argv.mode === "development" ? "inline-source-map" : false,
});
