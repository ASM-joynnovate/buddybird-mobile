module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    {
      name: "services-independent-of-ui",
      severity: "error",
      from: { path: "^app/services/" },
      to: { path: "^app/(context|screens|components|navigators)/" },
    },
    {
      name: "utilities-independent-of-product",
      severity: "error",
      from: { path: "^app/utils/" },
      to: { path: "^app/(services|context|screens|components|navigators)/" },
    },
    {
      name: "native-independent-of-app",
      severity: "error",
      from: { path: "^modules/" },
      to: { path: "^app/" },
    },
    {
      name: "shared-ui-independent-of-screens",
      severity: "error",
      from: { path: "^app/components/" },
      to: { path: "^app/(screens|navigators)/" },
    },
    {
      name: "async-storage-only-for-migration",
      severity: "error",
      from: { pathNot: "^app/services/migration\\.ts$" },
      to: { path: "node_modules/@react-native-async-storage/" },
    },
    { name: "no-unresolved-imports", severity: "error", from: {}, to: { couldNotResolve: true } },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      conditionNames: ["react-native", "import", "require", "default"],
      extensions: [".ts", ".tsx", ".js", ".json"],
    },
  },
}
