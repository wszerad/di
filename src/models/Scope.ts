import { Disposable, Lifetime, Token } from '../types'
import { globalModule, Module } from './Module'

let currentScope: Scope

export function getCurrScope() {
	return currentScope
}

export function setCurrScope(scope: Scope){
	const prevScope = currentScope
	currentScope = scope
	return () => currentScope = prevScope
}

export class Scope {
	private readonly cache = new Map<Token, any>()
	private readonly disposables = new Set<Disposable>()

	constructor(
		private readonly module: Module
	) {}

	private runInScope<T>(runner: () => T): T {
		const reset = setCurrScope(this)
		const value = runner()
		reset()
		return value
	}

	onDispose(cb: Disposable) {
		this.disposables.add(cb)
	}

	inject<T>(token: Token<T>): T {
		const registration = this.module.getProvider(token)

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return this.runInScope(() => registration.value)
		}

		if (registration.lifetime === Lifetime.SCOPED) {
			if (this.cache.has(token)) {
				return this.cache.get(token)
			}
			const value = this.runInScope(() => registration.value)
			this.cache.set(token, value)
			return value
		}

		return globalScope.runInScope(() => registration.value)
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
