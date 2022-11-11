module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-unused-vars": "warn",
    "no-empty": ["warn", { allowEmptyCatch: true }],
  },
  extends: "eslint:recommended",
};
