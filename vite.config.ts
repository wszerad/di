/// <reference types="vite-plus/test" />

import { defineConfig } from 'vite-plus'

export default defineConfig({
	// `vp pack` (tsdown) builds the publishable library.
	pack: {
		entry: ['src/index.ts'],
		format: ['esm', 'cjs'],
		dts: true,
		sourcemap: true,
		clean: true,
	},
	// `vp fmt` (oxfmt) — keep the repository's tabs / single quotes / no semicolons.
	fmt: {
		useTabs: true,
		singleQuote: true,
		semi: false,
		ignorePatterns: ['dist/**'],
	},
	// `vp lint` (oxlint + tsgolint type-aware rules).
	lint: {
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
		options: { typeAware: true, typeCheck: true },
	},
	// `vp staged` runs on pre-commit via the Vite+ git hook dispatcher.
	staged: {
		'*': 'vp check --fix',
	},
	// `vp test` (vitest).
	test: {
		globals: true,
	},
})
