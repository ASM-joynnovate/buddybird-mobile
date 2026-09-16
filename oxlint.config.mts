import { defineConfig } from "oxlint"
import native from "oxlint-config-universe/native"

const assetExtensions =
	"\\.(aac|aiff|avif|bmp|caf|db|gif|heic|html|jpeg|jpg|json|m4a|m4v|mov|mp3|mp4|mpeg|mpg|otf|pdf|png|psd|svg|ttf|wav|webm|webp|xml|yaml|yml|zip)$"
const relativeImport = {
	group: ["./*", "../*"],
	message: "Use the project's @/, @assets/, or @modules/ import aliases.",
}
const touchables = ["PressableSurface", "ChoiceCard", "Button", "IconButton", "Chip"]

export default defineConfig({
	extends: [native],
	plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "node", "react", "promise"],
	jsPlugins: [
		{ name: "query", specifier: "oxlint-plugin-query" },
		{ name: "react-native", specifier: "oxlint-plugin-react-native" },
		{ name: "react-native-a11y", specifier: "eslint-plugin-react-native-a11y" },
	],
	options: { typeAware: true },
	ignorePatterns: ["node_modules", "ios", "android", "dist", ".expo"],
	rules: {
		"react/rules-of-hooks": "error",
		"react/exhaustive-deps": "warn",
		"one-var": ["error", "never"],
		"curly": ["error", "all"],
		"typescript/no-require-imports": ["warn", { allow: [assetExtensions] }],
		"no-restricted-imports": ["error", { patterns: [relativeImport] }],
		"no-void": "off",
		"typescript/unbound-method": "off",

		"typescript/consistent-type-imports": [
			"error",
			{ prefer: "type-imports", fixStyle: "inline-type-imports" },
		],
		"typescript/no-import-type-side-effects": "error",
		"no-shadow": "error",
		"require-await": "error",
		"typescript/no-non-null-assertion": "error",
		"promise/always-return": "error",
		"promise/no-multiple-resolved": "error",
		"no-param-reassign": "error",
		"react/jsx-no-constructed-context-values": "error",
		"react/no-unstable-nested-components": ["error", { allowAsProps: true }],
		"react/exhaustive-effect-dependencies": "warn",
		"react/no-deriving-state-in-effects": "warn",
		"react/memo-dependencies": "warn",
		"react/jsx-key": [
			"error",
			{ checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true },
		],
		"array-callback-return": "error",
		"preserve-caught-error": "error",
		"no-console": ["warn", { allow: ["warn", "error"] }],
		"typescript/ban-ts-comment": [
			"error",
			{ "ts-expect-error": "allow-with-description", minimumDescriptionLength: 10 },
		],
		"typescript/no-explicit-any": "warn",
		"import/no-self-import": "error",
		"unicorn/error-message": "error",
		"unicorn/no-instanceof-array": "error",
		"unicorn/no-array-fill-with-reference-type": "error",
		"oxc/no-accumulating-spread": "error",

		"typescript/no-floating-promises": "error",
		"typescript/no-misused-promises": ["error", { checksVoidReturn: false }],
		"typescript/await-thenable": "error",
		"typescript/switch-exhaustiveness-check": "error",
		"typescript/restrict-template-expressions": "error",
		"typescript/prefer-nullish-coalescing": "error",
		"typescript/strict-void-return": "error",
		"typescript/no-deprecated": "warn",
		"typescript/no-unsafe-argument": "warn",
		"typescript/no-unsafe-member-access": "warn",
		"typescript/no-unsafe-return": "warn",

		"query/exhaustive-deps": "error",
		"query/no-rest-destructuring": "warn",
		"query/stable-query-client": "error",
		"query/no-unstable-deps": "error",
		"query/infinite-query-property-order": "error",
		"query/mutation-property-order": "error",
		"react-native/no-unused-styles": "error",
		"react-native/no-single-element-style-arrays": "error",
		"react-native/no-color-literals": "error",
		"react-native-a11y/has-accessibility-hint": "off",
		"react-native-a11y/has-accessibility-props": ["error", { touchables }],
		"react-native-a11y/has-valid-accessibility-actions": "error",
		"react-native-a11y/has-valid-accessibility-role": "error",
		"react-native-a11y/has-valid-accessibility-state": "error",
		"react-native-a11y/has-valid-accessibility-states": "error",
		"react-native-a11y/has-valid-accessibility-component-type": "error",
		"react-native-a11y/has-valid-accessibility-traits": "error",
		"react-native-a11y/has-valid-accessibility-value": "error",
		"react-native-a11y/has-valid-accessibility-descriptors": "error",
		"react-native-a11y/no-nested-touchables": ["error", { touchables }],
		"react-native-a11y/has-valid-accessibility-ignores-invert-colors": "error",
		"react-native-a11y/has-valid-accessibility-live-region": "error",
		"react-native-a11y/has-valid-important-for-accessibility": "error",
	},
	overrides: [
		{
			files: ["**/*.js"],
			rules: { "typescript/no-require-imports": "off" },
		},
		{
			files: ["app/**/*.tsx"],
			excludeFiles: ["app/components/ui/surface.tsx", "app/components/ui/text-field.tsx"],
			rules: {
				"no-restricted-imports": [
					"error",
					{
						patterns: [relativeImport],
						paths: [
							{
								name: "react-native",
								importNames: [
									"Pressable",
									"TouchableOpacity",
									"TouchableHighlight",
									"TouchableWithoutFeedback",
									"TextInput",
								],
								message:
									"Use the shared controls/ChoiceCard/PressableSurface or TextField from components/ui.",
							},
							{
								name: "react-native-gesture-handler",
								importNames: ["Gesture", "GestureDetector"],
								message: "Keep press gestures in the shared PressableSurface.",
							},
						],
					},
				],
			},
		},
	],
})
