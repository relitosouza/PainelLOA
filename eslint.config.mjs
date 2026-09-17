import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const reactHooksPlugin = nextVitals.find((entry) => entry.plugins?.["react-hooks"])?.plugins["react-hooks"];
const config = [
  { ignores: [".next/**", "next-env.d.ts", ".agents/**", "execution/**", "test-results/**", ".tmp/**", ".kilo/**"] },
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "react-hooks": reactHooksPlugin },
    rules: {
      "@next/next/no-page-custom-font": "off",
      // Regras do React Compiler ativadas no eslint-config-next 16; mantidas como aviso até a revisão dos componentes.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];
export default config;
