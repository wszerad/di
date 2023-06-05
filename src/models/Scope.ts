import { Disposable, Token, Registration } from '../types'
import { Module } from './Module'

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

	private runInScope(runner?: () => void): this {
		const reset = setCurrScope(this)
		runner?.()
		reset()
		return this
	}

	getValue<T>(registration: Registration<T>): T {
		const token = registration.token
		let value: any

		this.runInScope(() => {
			if (this.cache.has(token)) {
				value = this.cache.get(token)
				return
			}
			value = registration.get()
			this.cache.set(token, value)
		})

		return value
	}

	onDispose(cb: Disposable) {
		this.disposables.add(cb)
	}

	inject<T>(token: Token<T>): T {
		return this.module.resolve(token, this)
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