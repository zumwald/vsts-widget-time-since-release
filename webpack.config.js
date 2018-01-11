const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const { join } = require("path");

const outDir = join(__dirname, "dist");

module.exports = {
  entry: {
    index: join(__dirname, "index.js"),
    config: join(__dirname, "config.js")
  },

  output: {
    filename: "[name].js",
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
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(outDir),
    new webpack.optimize.CommonsChunkPlugin({
      name: "index",
      chunks: ["index"]
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "config",
      chunks: ["config"]
    }),
    new HtmlWebpackPlugin({
      template: join(__dirname, "index.html"),
      inject: "head",
      chunks: ["index"],
      filename: "index.html"
    }),
    new HtmlWebpackPlugin({
      template: join(__dirname, "config.html"),
      inject: "head",
      chunks: ["config"],
      filename: "config.html"
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
