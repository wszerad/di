import { Disposable, Lifetime, Token, Registration } from '../types'
import { Module } from './Module'

let currentScope: Scope

export function getCurrScope() {
	return currentScope
}

export function setCurrScope(scope: Scope){
	const prevContext = currentScope
	currentScope = scope
	return () => currentScope = prevContext
}

export class Scope {
	cache = new Map<Token<any>, any>()
	disposables = new Set<Disposable>()

	constructor(
		public module: Module
	) {}

	private getValue<T>(registration: Registration<T>): T {
		const token = registration.token
		const reset = setCurrScope(this)
		if (this.cache.has(token)) {
			reset()
			return this.cache.get(token)
		}
		const value = registration.get()
		this.cache.set(token, value)
		reset()
		return value
	}

	onDispose(cb: Disposable) {
		this.disposables.add(cb)
	}

	run(runner?: () => void): this {
		const reset = setCurrScope(this)
		runner?.()
		reset()
		return this
	}

	inject<T>(token: Token<T>): T {
		const registration: Registration<T> = this.module.register.get(token)

		this.module.lock()

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return registration.get()
		}

		if (registration.lifetime === Lifetime.SCOPED) {
			return this.getValue(registration)
		}

		return this.module.singletonsContext.getValue(registration)
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