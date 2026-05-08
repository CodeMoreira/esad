const path = require('node:path');
const fs = require('node:fs');
const Repack = require('@callstack/repack');
const { ExpoModulesPlugin } = require('@callstack/repack-plugin-expo-modules');

/**
 * ESAD Re.Pack Plugin Wrapper (v2.0 - POC Mirror)
 * Totalmente alinhado com a POC funcional para Expo 52 + Re.Pack 5.
 * 
 * @param {Object} env Rspack environment
 * @param {Object} options 
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
            options: {},
          },
        },
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin(),
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
