module.exports = {
  root: true,
  extends: ["expo", "prettier"],
  ignorePatterns: ["node_modules", "ios", "android", "dist"],
  rules: {
    "import/no-unresolved": "off",
    "one-var": ["error", "never"],
    "curly": ["error", "all"],
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: ["const", "let"], next: "*" },
      { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
      {
        blankLine: "always",
        prev: "*",
        next: ["return", "if", "for", "while", "switch", "try", "function", "class", "export"],
      },
      { blankLine: "always", prev: "block-like", next: "*" },
    ],
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "pathGroups": [
          { pattern: "@/**", group: "internal" },
          { pattern: "@assets/**", group: "internal" },
          { pattern: "@modules/**", group: "internal" },
          { pattern: "@test/**", group: "internal" },
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "newlines-between": "always-and-inside-groups",
      },
    ],
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["./*", "../*"],
            message: "Use the project's @/, @assets/, @modules/, or @test/ import aliases.",
          },
        ],
      },
    ],
    "no-restricted-modules": ["error", { patterns: ["./*", "../*"] }],
  },
}
