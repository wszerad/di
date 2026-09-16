import { getCurrScope, setCurrScope } from '../context'
import { collectDisposables } from '../decorators'
import { Registration } from '../registrations/Registration'
import { Disposable, Lifetime, Token } from '../types'
import { globalModule, Module } from './Module'

export class Scope {
	private readonly cache = new Map<Token, any>()
	private readonly disposables = new Set<Disposable>()

	constructor(private readonly module: Module) {}

	onDispose(cb: Disposable) {
		this.disposables.add(cb)
	}

	inject<T>(token: Token<T>): T {
		const registration = this.module.get(token)

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return this.resolve(registration, this)
		}

		if (registration.lifetime === Lifetime.SCOPED) {
			if (this.cache.has(token)) {
				return this.cache.get(token)
			}
			const value = this.resolve(registration, this)
			this.cache.set(token, value)
			return value
		}

		return this.resolve(registration, globalScope)
	}

	async dispose(): Promise<void> {
		this.cache.clear()
		const dispose = Promise.all(
			Array.from(this.disposables.values()).map((disposable) => disposable()),
		)
		this.disposables.clear()
		await dispose
	}

	/**
	 * Builds the registration inside `scope` and hooks up the methods marked by the legacy
	 * `@disposable`, but only when the registration actually created a new instance.
	 * The ECMAScript protocol registers itself from `addInitializer` instead.
	 */
	private resolve<T>(registration: Registration<T>, scope: Scope): T {
		return runInScope(() => {
			const reused = registration.resolved
			const value = registration.value

			if (!reused) {
				for (const key of collectDisposables(value)) {
					currScope().onDispose(() => (value as any)[key]())
				}
			}

			return value
		}, scope)
	}
}

export const globalScope = new Scope(globalModule)

export function currScope(): Scope {
	return getCurrScope() ?? globalScope
}

export function currScopeResolve<T>(token: Token<T>): T {
	const scope = getCurrScope()

	if (!scope) {
		return runInScope(() => globalScope.inject(token))
	}

	return scope.inject(token)
}

function runInScope<T>(runner: () => T, scope = globalScope): T {
	const reset = setCurrScope(scope)
	const value = runner()
	reset()
	return value
}
