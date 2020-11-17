const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: {
        index: path.resolve(__dirname, 'index.js'),
    },
    output: {
        library: 'SnowcsvPageConnect',
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['babel-loader'],
                exclude: [
                    path.resolve(__dirname, './node_modules'),
                ],
            },
        ],
    },

    externals: ['react-redux', 'reselect', 'redux-saga/effects', 'redux'],
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(),
    ],
}
