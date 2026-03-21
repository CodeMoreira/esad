module.exports = {
  tailwindConfig: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};`,

  babelConfig: `module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};`,

  authProvider: `import { createContext, useEffect, useState, useContext } from "react";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        SecureStore.getItemAsync("token").then((val) => {
            setToken(val);
            setIsInitialized(true);
        });
    }, []);

    const login = (mockToken = "session_token") => {
        setToken(mockToken);
        SecureStore.setItemAsync("token", mockToken);
    };

    const logout = () => {
        setToken(null);
        SecureStore.deleteItemAsync("token");
    };

    return (
        <AuthContext.Provider value={{ token, login, logout, isInitialized }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);`,

  rootLayout: `import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/providers/auth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "./global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
         <RootNavigation />
      </AuthProvider>\n    </SafeAreaProvider>
  );
}

function RootNavigation() {
  const { token, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;\n\n    // Global SuperApp Registry
    globalThis.__SUPERAPP__ = {
       getToken: () => token,
       navigate: (route, params) => router.push({ pathname: route, params })
    };\n  }, [isInitialized, token]);

  if (!isInitialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
       <Stack.Screen name="login" redirect={!!token} />
       <Stack.Screen name="(protected)" redirect={!token} />
    </Stack>
  );
}`,

  loginPage: `import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/providers/auth";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-6">
      <View className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <Text className="text-3xl font-bold text-slate-900 mb-2">Welcome</Text>
        <Text className="text-slate-500 mb-8">Sign in to access your SuperApp modules</Text>\n        
        <TouchableOpacity 
          onPress={() => login()}
          className="w-full bg-indigo-600 py-4 rounded-2xl items-center shadow-lg active:bg-indigo-700"
        >
          <Text className="text-white font-semibold text-lg">Entrar no App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}`,

  globalCss: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,

  moduleLoader: `import { ScriptManager } from "@callstack/repack/client";

export async function loadModule(config) {
  await ScriptManager.shared.addScript({
    id: config.id,
    url: config.url
  });

  const container = global[config.scope];
  if (!container) throw new Error("Module " + config.scope + " not found");

  await container.init(__webpack_share_scopes__.default);
  const factory = await container.get(config.module);
  return factory();
}`,

  dashboard: `import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/providers/auth";

const MOCK_MODULES = [
  { id: 'mod1', name: 'Sales Dashboard', icon: '📊' },
  { id: 'mod2', name: 'Inventory Manager', icon: '📦' },
];

export default function Dashboard() {
  const { logout } = useAuth();

  return (
    <ScrollView className="flex-1 bg-slate-50 p-6 pt-16">
      <View className="flex-row justify-between items-center mb-8">
        <View>
           <Text className="text-sm text-slate-500">Welcome back,</Text>
           <Text className="text-2xl font-bold text-slate-900">Explorer</Text>
        </View>
        <TouchableOpacity onPress={logout} className="p-2">
           <Text className="text-red-500 font-medium">Logout</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-lg font-semibold text-slate-800 mb-4">Your Modules</Text>
      
      {MOCK_MODULES.map(m => (
        <Link key={m.id} href={\`/(protected)/module/\${m.id}\`} asChild>
          <TouchableOpacity className="bg-white p-6 rounded-2xl mb-4 shadow-sm border border-slate-100 flex-row items-center">
            <Text className="text-3xl mr-4">{m.icon}</Text>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">{m.name}</Text>
              <Text className="text-slate-500">Tap to open module</Text>
            </View>
          </TouchableOpacity>
        </Link>
      ))}
    </ScrollView>
  );
}`,

  modulePage: `import { useLocalSearchParams } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { loadModule } from "@/lib/moduleLoader";

export default function ModulePage() {
  const { id } = useLocalSearchParams();
  const [Module, setModule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {\n    // In real app, fetch config from registry by id\n    setError("Module dynamic loading requires a running CDN and Build setup.");\n  }, [id]);

  if (error) return (
    <View className="flex-1 items-center justify-center p-10 bg-white">
       <Text className="text-red-500 text-center font-medium mb-4">{error}</Text>
       <Text className="text-slate-400 text-center text-sm">Follow the README to setup your module registry.</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-white items-center justify-center">
       <ActivityIndicator size="large" color="#4f46e5" />
       <Text className="mt-4 text-slate-500">Loading federated module...</Text>
    </View>
  );
}`,

  indexJs: `import "expo-router/entry";`
};
