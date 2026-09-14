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
            message: "Use the project's @/, @assets/, or @modules/ import aliases.",
          },
        ],
      },
    ],
    "no-restricted-modules": ["error", { patterns: ["./*", "../*"] }],
  },
  overrides: [{
    files: ["app/**/*.tsx"],
    excludedFiles: ["app/components/ui/surface.tsx", "app/components/ui/text-field.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["./*", "../*"], message: "Use the project's import aliases." }],
        paths: [
          {
            name: "react-native",
            importNames: ["Pressable", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "TextInput"],
            message: "Use the shared controls/ChoiceCard/PressableSurface or TextField from components/ui.",
          },
          {
            name: "react-native-gesture-handler",
            importNames: ["Gesture", "GestureDetector"],
            message: "Keep press gestures in the shared PressableSurface.",
          },
        ],
      }],
    },
  }],
}
