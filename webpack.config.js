const path = require("path");
const webpack = require("webpack");

module.exports = [
    {
        mode: "production",
        entry: './src/preload.js',
        output: {
            path: path.resolve(__dirname),
            filename: "preload.js"
        },
    }];
