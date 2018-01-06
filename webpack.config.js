const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const { join } = require("path");

const outDir = join(__dirname, "dist");

module.exports = {
  entry: join(__dirname, "index.js"),

  output: {
    filename: "bundle.js",
    path: outDir
  },

  module: {
    rules: [
      {
        test: join(
          __dirname,
          "node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js"
        ),
        use: [
          {
            loader: "script-loader"
          }
        ]
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: join(__dirname, "index.html"),
      inject: "head"
    }),
    new CopyWebpackPlugin([
      {
        from: join(__dirname, "vss-extension.json"),
        to: outDir
      },
      {
        from: join(__dirname, "img"),
        to: join(outDir, "img")
      }
    ])
  ]
};
