const webpack = require('webpack');
const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './components/embed-popup/standalone-bundle-root.tsx', // Input file
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'embed-popup.js', // Output file
  },
  devtool: 'source-map', // Equivalent to sourcemap: true
  resolve: {
    // Allow imports like `@/lib/env` to resolve to the project root
    alias: { '@': path.resolve(__dirname) },
    extensions: ['.tsx', '.ts', '.js'], // Resolve TypeScript and JS files
  },
  plugins: [
    // NOTE: the below doesn't whitelist, see https://github.com/mrsteele/dotenv-webpack/issues/41
    new Dotenv(),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.webpack.json',
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: 'css-loader',
            options: {
              // Export CSS content as a string so we can inject it into a <style> tag
              exportType: 'string',
              esModule: true,
            },
          },
          'postcss-loader',
        ],
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    // Mark LiveKitEmbedFixed as an external global (optional depending on usage)
    LiveKitEmbedFixed: 'LiveKitEmbedFixed',
  },
};
