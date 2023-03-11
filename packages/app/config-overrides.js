const { ProvidePlugin } = require('webpack')

module.exports = function (config) {
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.(m?js|ts)$/,
          enforce: 'pre',
          use: ['source-map-loader']
        }
      ]
    },
    plugins: [
      ...config.plugins,
      new ProvidePlugin({
        process: 'process/browser'
      }),
      new ProvidePlugin({
        Buffer: ['buffer', 'Buffer']
      })
    ],
    resolve: {
      ...config.resolve,
      fallback: {
        assert: require.resolve('assert'),
        buffer: require.resolve('buffer'),
        child_process: false,
        constants: require.resolve("constants-browserify"),
        crypto: require.resolve('crypto-browserify'),
        fs: false,
        os: require.resolve("os-browserify/browser"),
        path: require.resolve("path-browserify"),
        perf_hooks: false,
        stream: require.resolve('stream-browserify'),
        url: false,
        zlib: require.resolve('browserify-zlib'),
      }
    },
    ignoreWarnings: [/Failed to parse source map/]
  }
}
