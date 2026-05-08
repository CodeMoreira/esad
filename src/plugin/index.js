const path = require('node:path');
const fs = require('node:fs');
const Repack = require('@callstack/repack');
const { ExpoModulesPlugin } = require('@callstack/repack-plugin-expo-modules');
const rspack = require('@rspack/core');
const dotenv = require('dotenv');

/**
 * ESAD Re.Pack Plugin Wrapper
 * 
 * @param {Object} env Rspack environment
 * @param {Object} options 
 */
function withESAD(env, options) {
  const { platform, dev } = env;
  const isDev = dev !== false;

  const dirname = options.dirname;

  process.env.EXPO_OS = platform;

  // --- Automatic Environment Variable Logic ---
  // Load .env file from the user's project root
  const envPath = path.resolve(dirname, '.env');
  const envVars = dotenv.config({ path: envPath }).parsed || {};

  const publicEnvs = {};
  // Map variables from .env file and system variables that start with EXPO_PUBLIC_
  const allSources = { ...process.env, ...envVars };

  Object.keys(allSources).forEach((key) => {
    if (key.startsWith('EXPO_PUBLIC_')) {
      publicEnvs[`process.env.${key}`] = JSON.stringify(allSources[key] || '');
    }
  });
  // --------------------------------

  const pkgPath = path.resolve(dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const id = options.id.replace(/-/g, '_');

  const sdkPkgPath = path.resolve(__dirname, '..', '..', 'package.json');
  const sdkPkg = JSON.parse(fs.readFileSync(sdkPkgPath, 'utf8'));
  const clientPath = path.resolve(__dirname, '..', 'client', 'index.js');

  return Repack.defineRspackConfig({
    context: dirname,
    mode: isDev ? 'development' : 'production',
    entry: options.entry || './index.js',
    resolve: {
      ...Repack.getResolveOptions(),
      conditionNames: ['require', 'import', 'module', 'browser', 'react-native'],
      exportsFields: ['exports'],
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          type: 'javascript/auto',
          use: {
            loader: '@callstack/repack/babel-swc-loader',
            parallel: true,
            options: {
              env: {
                EXPO_OS: platform,
              },
              // Injetamos um plugin extra de transformação apenas para o EXPO_OS
              plugins: [
                [
                  require.resolve('babel-plugin-transform-define'),
                  {
                    'process.env.EXPO_OS': platform,
                    ...publicEnvs,
                  },
                ],
              ],
            },
          },
        },
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin(),
      new rspack.DefinePlugin(publicEnvs),
      new Repack.plugins.ModuleFederationPluginV2({
        name: id,
        filename: `${id}.container.js.bundle`,
        remotes: options.remotes || {},
        ...(options.type === 'module' ? {
          exposes: options.exposes || {
            './Main': options.entry || './index.js'
          }
        } : {}),
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
      }),
      new ExpoModulesPlugin(),
    ],
  });
}

module.exports = { withESAD };
