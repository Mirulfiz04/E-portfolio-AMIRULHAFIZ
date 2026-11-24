import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "playwright-report/**", "test-results/**", "assets/**"] },
  js.configs.recommended,
  {
    rules: {
      // localStorage/sessionStorage can throw (private windows, blocked storage), so the site wraps them in try/catch on purpose
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none" }]
    }
  },
  {
    // the site itself: classic <script defer> files that run in the browser
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: { ...globals.browser, gsap: "readonly", ScrollTrigger: "readonly", Lenis: "readonly" }
    }
  },
  {
    // tooling: tests, scripts and config run in Node as ES modules
    files: ["tests/**/*.js", "scripts/**/*.mjs", "*.config.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node, ...globals.browser } }
  }
];
