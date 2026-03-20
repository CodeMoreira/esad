const Repack = require('@callstack/repack');

/**
 * ESAD Re.Pack Plugin Wrapper
 * Abstracts away the boilerplate of Module Federation for SuperApps.
 * 
 * @param {Object} options 
 * @param {string} options.type 'host' | 'module'
 * @param {string} options.id Unique module or host ID
 */
function withESAD(options) {
  return (env) => {
    // In a real scenario, we merge heavily with Repack.getTemplateConfig here
    console.log(`[ESAD Plugin] Applying Zero-Config Re.Pack profile for ${options.type.toUpperCase()}: ${options.id}`);
    
    // Ensure the esad state library is ALWAYS shared
    const sharedConfig = {
      react: { singleton: true, eager: options.type === 'host' },
      'react-native': { singleton: true, eager: options.type === 'host' },
      'esad/client': { singleton: true, eager: true } // Crucial for Global State
    };

    return {
      // Configuration abstraction
      plugins: [
        new Repack.plugins.ModuleFederationPlugin({
          name: options.id.replace(/-/g, '_'),
          shared: sharedConfig,
          // If type is module, also configure exposes
          ...(options.type === 'module' && {
            exposes: {
              './App': './src/App'
            }
          })
        })
      ]
    };
  };
}

module.exports = { withESAD };
