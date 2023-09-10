// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/. 

const path = require("path");
const webpack = require("webpack");

module.exports = [
    {
        mode: "none",
        entry: './src/preload.js',
        output: {
            path: path.resolve(__dirname),
            filename: "preload.js"
        },
    }];
