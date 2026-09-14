module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    {
      name: "services-independent-of-ui",
      severity: "error",
      from: { path: "^app/services/" },
      to: { path: "^app/(context|hooks|providers|screens|components|navigators)/" },
    },
    {
      name: "utilities-independent-of-product",
      severity: "error",
      from: { path: "^app/utils/" },
      to: { path: "^app/(apis|services|context|hooks|providers|screens|components|navigators)/" },
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
      from: { pathNot: "^app/services/migration/migrate-data\\.ts$" },
      to: { path: "node_modules/@react-native-async-storage/" },
    },
    {
      name: "apis-independent-of-ui",
      severity: "error",
      from: { path: "^app/apis/" },
      to: { path: "^app/(components|context|hooks|navigators|providers|screens)/" },
    },
    {
      name: "hooks-independent-of-views",
      severity: "error",
      from: { path: "^app/(hooks/|screens/[^/]+/hooks/)" },
      to: { path: "^app/(components|navigators|providers)/|^app/screens/[^/]+/(components/|[^/]+\\.tsx$)" },
    },
    {
      name: "ui-primitives-independent-of-product",
      severity: "error",
      from: { path: "^app/components/ui/" },
      to: { path: "^app/(apis|context|hooks|navigators|providers|screens|services)/" },
    },
    {
      name: "types-independent-of-implementation",
      severity: "error",
      from: { path: "^app/types/" },
      to: { path: "^app/(apis|components|context|hooks|i18n|lib|navigators|providers|screens|services|theme|utils)/" },
    },
    {
      name: "context-independent-of-implementation",
      severity: "error",
      from: { path: "^app/context/" },
      to: { path: "^app/(apis|components|hooks|lib|navigators|providers|screens|services)/" },
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
