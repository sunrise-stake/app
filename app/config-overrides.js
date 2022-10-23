const { ProvidePlugin } = require('webpack');

module.exports = function (config, env) {
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(m?js|ts)$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
      ],
    },
    plugins: [
      ...config.plugins,
      new ProvidePlugin({
        process: 'process/browser',
      }),
      new ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    resolve: {
      ...config.resolve,
      fallback: {
        assert: require.resolve('assert'),
        buffer: require.resolve('buffer'),
        crypto: require.resolve('crypto-browserify'),
        fs: false,
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
      },
    },
    ignoreWarnings: [/Failed to parse source map/],
  };
};
