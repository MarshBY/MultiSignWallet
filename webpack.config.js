const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

//const port = process.env.PORT || 3000;
const mode = 'production'; //'development'

module.exports = {
    mode: mode,
    entry: './src/index.js',
    devServer: {
        static: './public',
        hot: true
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.[fullhash].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: true,
                        cacheCompression: false,
                        envName: 'production'
                    }
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
        ]
    },
    resolve: {
        extensions: [".js", ".jsx"]
    },
    plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
    watch: mode == 'development',
    //devtool: 'eval' //'source-map' //'eval-source-map'
};