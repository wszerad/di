import type { Scope } from './models/Scope'

let currentScope: Scope | undefined

export function getCurrScope(): Scope | undefined {
	return currentScope
}

export function setCurrScope(scope: Scope) {
	const prevScope = currentScope
	currentScope = scope
	return () => (currentScope = prevScope)
}
