import { Disposable, Lifetime, Token } from '../types'
import { globalModule, Module } from './Module'

let currentScope: Scope

export class Scope {
	private readonly cache = new Map<Token, any>()
	private readonly disposables = new Set<Disposable>()

	constructor(
		private readonly module: Module
	) {}

	onDispose(cb: Disposable) {
		this.disposables.add(cb)
	}

	inject<T>(token: Token<T>): T {
		const registration = this.module.get(token)

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return runInScope(() => registration.value, this)
		}

		if (registration.lifetime === Lifetime.SCOPED) {
			if (this.cache.has(token)) {
				return this.cache.get(token)
			}
			const value = runInScope(() => registration.value, this)
			this.cache.set(token, value)
			return value
		}

		return runInScope(() => registration.value)
	}

	async dispose(): Promise<void> {
		this.cache.clear()
		const dispose = Promise
			.all(
				Array
					.from(this.disposables.values())
					.map(disposable => disposable())
			)
		this.disposables.clear()
		await dispose
	}
}

export const globalScope = new Scope(globalModule)

export function getCurrScope() {
	return currentScope
}

export function setCurrScope(scope: Scope) {
	const prevScope = currentScope
	currentScope = scope
	return () => currentScope = prevScope
}

export function currScopeResolve<T>(token: Token<T>): T {
	const currScope = getCurrScope()

	if (!currScope) {
		const scope = globalScope
		const reset = setCurrScope(scope)
		const value = scope.inject(token)
		reset()
		return value
	}

	return currScope.inject(token)
}

function runInScope<T>(runner: () => T, scope = globalScope): T {
	const reset = setCurrScope(scope)
	const value = runner()
	reset()
	return value
}