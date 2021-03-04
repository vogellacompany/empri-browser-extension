// This file is not going through babel transformation.
// So, we write it in vanilla JS
// (But you could use ES2015 features supported by your Node.js version)
const webpack = require("webpack");

module.exports = {
  webpack: (config, { dev, vendor }) => {
    // Perform customizations to webpack config

    // TODO(FAP): can be removed once https://github.com/webextension-toolbox/webextension-toolbox/pull/347 is merged
    // Add webextension polyfill
    if (["edge"].includes(vendor)) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          browser: require.resolve("webextension-polyfill"),
        })
      );

      // The webextension-polyill doesn't work well with webpacks ProvidePlugin.
      // So we need to monkey patch it on the fly
      // More info: https://github.com/mozilla/webextension-polyfill/pull/86
      config.module.rules.push({
        test: /webextension-polyfill[\\/]+dist[\\/]+browser-polyfill\.js$/,
        loader: require.resolve("string-replace-loader"),
        query: {
          search: 'typeof browser === "undefined"',
          replace:
            'typeof window.browser === "undefined" || Object.getPrototypeOf(window.browser) !== Object.prototype',
        },
      });
    }

    if (process.env.NODE_ENV === "production") {
      var apiUrl = "https://empri-devops.vogella.com:5555";
    } else if (process.env.NODE_ENV === "development") {
      var apiUrl = "http://localhost:5555";
    }

    config.plugins.push(
      new webpack.DefinePlugin({
        API_URL: JSON.stringify(apiUrl),
      })
    );

    // Important: return the modified config
    return config;
  },
};
