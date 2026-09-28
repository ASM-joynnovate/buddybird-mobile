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
    layer("types", { path: "^app/types/", pathNot: "^app/types/apis/" }, "^app/(types/(?!apis/)|config/)"),
    layer("types-apis", "^app/types/apis/", "^app/(types/|config/|utils/units\\.ts$)"),
    layer("utils", "^app/utils/", "^app/(utils|types|config)/"),
    layer("lib", "^app/lib/", "^app/(lib|config|types|utils)/"),
    layer("apis", "^app/apis/", "^app/(apis/|config/|lib/api\\.ts$|types/apis/|mocks/)"),
    layer("mocks", "^app/mocks/", "^app/(mocks|types/apis|utils|config)/"),
    layer("stores", "^app/stores/", "^app/(stores/keys\\.ts$|config/|types/|utils/|lib/storage\\.ts$)"),
    layer("services", "^app/services/", "^app/(services|config|types|utils|lib|apis|mocks|stores|i18n)/"),
    layer(
      "hooks-apis",
      "^app/hooks/apis/",
      "^app/(hooks/apis/|apis/|config/|types/apis/|lib/query-client\\.ts$|stores/account\\.ts$|services/telemetry/client\\.ts$)",
    ),
    layer(
      "providers",
      "^app/providers/",
      "^app/((providers|config|types|utils|lib|apis|mocks|stores|services|hooks|i18n)/|components/dialogs/)",
    ),
    layer(
      "hooks",
      { path: "^app/hooks/", pathNot: "^app/hooks/apis/" },
      "^app/(hooks|config|types|utils|lib|apis|mocks|stores|services|i18n|theme)/",
    ),
    layer(
      "components",
      { path: "^app/components/", pathNot: "^app/components/app/" },
      "^app/(components|config|types|utils|lib|apis|mocks|stores|services|hooks|providers|i18n|theme)/",
    ),
    layer(
      "components-app",
      "^app/components/app/",
      "^app/(components|config|types|utils|lib|apis|mocks|stores|services|hooks|providers|i18n|theme|navigators)/",
    ),
    {
      name: "components-ui",
      severity: "error",
      from: { path: "^app/components/ui/" },
      to: { path: "^app/(apis|mocks|stores|services|hooks|providers|screens|navigators)/|^app/components/(?!ui/)" },
    },
    layer(
      "screens",
      "^app/screens/",
      "^app/(screens|components|config|types|utils|lib|mocks|stores|services|hooks|providers|i18n|theme)/",
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
    layer("i18n", "^app/i18n/", "^app/((i18n|types|config)/|utils/units\\.ts$)"),
    layer("theme", "^app/theme/", "^app/(theme|types|config)/"),
    {
      name: "mmkv-only-in-storage-adapters",
      severity: "error",
      from: { pathNot: "^app/lib/storage\\.ts$" },
      to: { path: "node_modules/react-native-mmkv/" },
    },
    {
      name: "async-storage-only-for-migration",
      severity: "error",
      from: { pathNot: "^app/services/migration/upload-legacy\\.ts$" },
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
