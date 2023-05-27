import { Disposable, Lifetime, Token } from './types'
import { Registration } from './Registration'
import { Module } from './Module'

let currentContext: Context

export function getCurrContext() {
	return currentContext
}

export function setCurrContext(context: Context){
	const prevContext = currentContext
	currentContext = context
	return () => currentContext = prevContext
}

export class Context {
	cache = new Map<Token<any>, any>()
	disposables = new Set<Disposable>()

	constructor(
		public module: Module
	) {}

	private getValue<T>(registration: Registration<T>): T {
		const token = registration.token
		const reset = setCurrContext(this)
		if (this.cache.has(token)) {
			reset()
			return this.cache.get(token)
		}
		const value = registration.factory()
		this.cache.set(token, value)
		reset()
		return value
	}

	onDispose(cb: Disposable) {
		this.disposables.add(cb)
	}

	resolve<T>(token: Token<T>): T {
		const registration: Registration<T> = this.module.register.get(token)

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return registration.factory()
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