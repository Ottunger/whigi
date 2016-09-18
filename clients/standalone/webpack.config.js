var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

module.exports = {
    devtool: 'source-map',
    entry: {
        polyfills: './app/polyfill.js',
        app: './app/main.js',
        vendors: './app/vendor.js'
    },
    output: {
        path: './dist',
        publicPath: '/',
        filename: '[name].js',
        chunkFilename: '[id].chunk.js'
    },
    resolve: {
        extensions: ['', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.html$/,
                loader: 'html'
            }, {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file?name=assets/[name].[ext]'
            }, {
                test: /\.css$/,
                exclude: 'app',
                loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
            }, {
                test: /\.css$/,
                include: 'app',
                loader: 'raw'
            }
        ]
    },
    htmlLoader: {
        minimize: false //Workaround for ng2
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ['app', 'vendors', 'polyfills']
        }),
        new HtmlWebpackPlugin({
            template: './index.html'
        }),
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({ //https://github.com/angular/angular/issues/10618
            mangle: {
                keep_fnames: true
            }
        }),
        new ExtractTextPlugin('[name].css'),
        new webpack.DefinePlugin({
            'process.env': {
                'ENV': JSON.stringify(ENV)
            }
        })
    ]
}