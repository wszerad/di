import { Token } from './types'
import { Registration } from './Registration'
import { Scope } from './Scope'

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

	constructor(
		public scope: Scope
	) {}

	getValue<T>(registration: Registration<T>): T {
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

	dispose() {
		this.cache.clear()
	}
}