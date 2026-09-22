const layer = (name, from, allowed) => ({
  name,
  severity: "error",
  from: typeof from === "string" ? { path: from } : from,
  to: { path: "^app/", pathNot: allowed },
})

module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    layer("config", "^app/config/", "^app/(config/|utils/units\\.ts$)"),
    layer("types", { path: "^app/types/", pathNot: "^app/types/apis/" }, "^app/types/(?!apis/)"),
    layer("types-apis", "^app/types/apis/", "^app/types/"),
    layer("utils", "^app/utils/", "^app/(utils|types)/"),
    layer("lib", "^app/lib/", "^app/(lib|config|types|utils)/"),
    layer("apis", "^app/apis/", "^app/(apis/|lib/api\\.ts$|types/apis/|mocks/)"),
    layer("mocks", "^app/mocks/", "^app/(mocks|types/apis|utils)/"),
    layer("stores", "^app/stores/", "^app/(stores/keys\\.ts$|types/|utils/|lib/storage\\.ts$)"),
    layer("services", "^app/services/", "^app/(services|config|types|utils|lib|apis|mocks|stores|i18n)/"),
    layer(
      "hooks-apis",
      "^app/hooks/apis/",
      "^app/(hooks/apis/|apis/|types/apis/|lib/query-client\\.ts$|stores/account\\.ts$)",
    ),
    layer(
      "providers",
      "^app/providers/",
      "^app/(providers|config|types|utils|lib|apis|mocks|stores|services|hooks|i18n|context)/",
    ),
    layer(
      "hooks",
      { path: "^app/hooks/", pathNot: "^app/hooks/apis/" },
      "^app/(hooks|config|types|utils|lib|apis|mocks|stores|services|i18n|theme|context)/",
    ),
    layer(
      "components",
      "^app/components/",
      "^app/(components|config|types|utils|lib|apis|mocks|stores|services|hooks|providers|i18n|theme|context)/",
    ),
    {
      name: "components-ui",
      severity: "error",
      from: { path: "^app/components/ui/" },
      to: { path: "^app/(apis|mocks|stores|services|hooks|providers|screens|navigators|context)/|^app/components/(?!ui/)" },
    },
    layer(
      "screens",
      "^app/screens/",
      "^app/(screens|components|config|types|utils|lib|mocks|stores|services|hooks|providers|i18n|theme|context)/",
    ),
    {
      name: "screens-independent-of-other-screens",
      severity: "error",
      from: { path: "^app/screens/([^/]+)/" },
      to: { path: "^app/screens/", pathNot: "^app/screens/$1/" },
    },
    {
      name: "screens-use-api-types-not-apis",
      severity: "error",
      from: { path: "^app/screens/" },
      to: { path: "^app/apis/" },
    },
    {
      name: "v1-legacy-data-hidden-from-v2",
      severity: "error",
      from: { path: "^app/(screens|hooks/apis|components)/" },
      to: {
        path: "^app/(services/migration/|services/storage/(data-store|codec|empty-data|verified-write)\\.ts$|context/app-data\\.ts$|types/app-data\\.ts$|hooks/use-app-data\\.ts$)",
      },
    },
    layer("i18n", "^app/i18n/", "^app/(i18n|types)/"),
    layer("theme", "^app/theme/", "^app/(theme|types)/"),
    layer("context", "^app/context/", "^app/(context|types)/"),
    {
      name: "mmkv-only-in-storage-adapters",
      severity: "error",
      from: { pathNot: "^app/(lib/storage\\.ts|lib/query-persister\\.ts|services/storage/data-store\\.ts)$" },
      to: { path: "node_modules/react-native-mmkv/" },
    },
    {
      name: "async-storage-only-for-migration",
      severity: "error",
      from: { pathNot: "^app/services/migration/import-legacy-data\\.ts$" },
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
