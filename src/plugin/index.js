const path = require('node:path');
const fs = require('node:fs');
const Repack = require('@callstack/repack');
const { ExpoModulesPlugin } = require('@callstack/repack-plugin-expo-modules');
const { ProvidePlugin, DefinePlugin } = require('@rspack/core');

/**
 * ESAD Re.Pack Plugin Wrapper
 * Abstracts away the boilerplate of Module Federation and SDK integration for SuperApps.
 * 
 * @param {Object} env Rspack environment
 * @param {Object} options 
 * @param {string} options.type 'host' | 'module'
 * @param {string} options.id Unique module or host ID
 * @param {string} options.dirname Base directory (__dirname)
 * @param {Object} [options.shared] Additional shared dependencies
 * @param {Object} [options.exposes] Modules to expose (for modules)
 * @param {Object} [options.remotes] Remote modules (for host)
 */
function withESAD(env, options) {
  const { platform, dev } = env;
  const isDev = dev !== false;
  const dirname = options.dirname;
  const pkgPath = path.resolve(dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const id = options.id.replace(/-/g, '_');
  const sdkPkgPath = path.resolve(__dirname, '..', '..', 'package.json');
  const sdkPkg = JSON.parse(fs.readFileSync(sdkPkgPath, 'utf8'));
  const clientPath = path.resolve(__dirname, '..', 'client', 'index.js');

  console.log(`[ESAD] Applying Mega-Zero-Config profile for ${options.type.toUpperCase()} (${platform}): ${id}`);

  const config = {
    mode: isDev ? 'development' : 'production',
    context: dirname,
    entry: options.entry || './index.js',
    output: {
      path: path.resolve(dirname, 'build', platform),
      filename: 'index.bundle',
      clean: true,
    },
    resolve: {
      ...Repack.getResolveOptions(),
      alias: {
        '@': path.resolve(dirname, '.'),
        // Internal MFv2 & Re.Pack Aliases (Magic)
        '@module-federation/runtime/helpers': path.resolve(dirname, 'node_modules/@module-federation/runtime/dist/helpers.js'),
        '@module-federation/error-codes/browser': path.resolve(dirname, 'node_modules/@module-federation/error-codes/dist/browser.cjs'),
        '@module-federation/sdk': path.resolve(dirname, 'node_modules/@module-federation/sdk'),
        
        ...Repack.getResolveOptions().alias,
        ...(options.alias || {}),
      }
    },
    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.[cm]?[jt]sx?$/,
              include: [
                /node_modules[\\/](react-native|@react-native|expo|expo-modules-core|@expo|react-navigation|@react-navigation|@unimodules|unimodules|native-base|react-native-screens|react-native-reanimated)/,
              ],
              type: 'javascript/auto',
              resolve: { fullySpecified: false },
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    'babel-preset-expo',
                  ],
                  plugins: [
                    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
                  ],
                  sourceType: 'unambiguous',
                  caller: { name: 'repack' },
                },
              },
            },
            {
              test: /\.[cm]?[jt]sx?$/,
              include: [dirname],
              exclude: [/node_modules/],
              type: 'javascript/auto',
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@react-native/babel-preset'],
                  sourceType: 'unambiguous',
                  caller: { name: 'repack' },
                },
              },
            },
            ...Repack.getJsTransformRules(),
          ]
        },
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new ProvidePlugin({
        process: 'process/browser',
      }),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
        '__DEV__': JSON.stringify(isDev),
      }),
      new ExpoModulesPlugin(),
      new Repack.RepackPlugin(),
      new Repack.plugins.ModuleFederationPluginV2({
        name: id,
        filename: `${id}.container.js.bundle`,
        remotes: options.remotes || {},
        ...(options.type === 'module' ? { exposes: options.exposes || {} } : {}),
        dts: false,
        dev: isDev,
        shared: {
          'react': { singleton: true, eager: true, requiredVersion: pkg.dependencies.react },
          'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: pkg.dependencies.react },
          'react-native': { singleton: true, eager: true, requiredVersion: pkg.dependencies['react-native'] },
          'react-native-safe-area-context': { singleton: true, eager: true, requiredVersion: pkg.dependencies['react-native-safe-area-context'] },
          '@codemoreira/esad/client': { 
            singleton: true, 
            eager: options.type === 'host',
            version: sdkPkg.version,
            requiredVersion: sdkPkg.version,
            import: clientPath 
          },
          ...(options.shared || {})
        }
      })
    ],
  };

  // Add Host-specific DevServer magic for Expo
  if (options.type === 'host') {
    config.devServer = {
      setupMiddlewares: (middlewares) => {
        middlewares.unshift((req, res, next) => {
          if (req.url.startsWith('/.expo/.virtual-metro-entry.bundle')) {
            const query = req.url.split('?')[1];
            const isMap = req.url.includes('.map');
            const target = isMap ? '/index.bundle.map' : '/index.bundle';
            const location = query ? `${target}?${query}` : target;
            res.writeHead(302, { Location: location });
            res.end();
            return;
          }
          next();
        });
        return middlewares;
      },
    };
  }

  return config;
}

module.exports = { withESAD };
