module.exports = {
  // Run Prettier on all supported files
  "*.{js,jsx,ts,tsx,json,css,md,mdx,yml,yaml}": ["prettier --write"],

  // Run ESLint on JavaScript/TypeScript files
  "*.{js,jsx,ts,tsx}": ["eslint --fix"],

  // Run GraphQL codegen if GraphQL files change
  "src/graphql/**/*.{ts,graphql}": () => "npm run codegen:compile",

  // Run TypeScript compiler check
  "*.{ts,tsx}": () => "tsc --noEmit",
};
