import { Token, Disposable } from './types'
import { getCurrScope, Scope, setCurrScope } from './models/Scope'
import { CircularInjectionError } from './errors'
import { isProduction } from './utils'
import { globalModule } from './models/Module'

const levels: Token[] = []
let deep = 0

function loopDetection(token: Token, action: () => any) {
	const localeDeep = deep++
	if (levels.includes(token)) {
		throw new CircularInjectionError([...levels, token])
	}
	levels[localeDeep] = token

	const result = action()
	levels.splice(localeDeep, levels.length - localeDeep)
	return result
}

function currScopeResolve<T>(token: Token<T>): T {
	const currScope = getCurrScope()

	if (!currScope) {
		const scope = new Scope(globalModule)
		const reset = setCurrScope(scope)
		const value = scope.inject(token)
		reset()
		return value
	}

	return currScope.inject(token)
}

export function inject<T>(token: Token<T>): T {
	if (!isProduction) {
		return loopDetection(token, () => currScopeResolve(token))
	}

	return currScopeResolve(token)
}

export function onDispose(cb: Disposable) {
	getCurrScope().onDispose(cb)
}

export function dispose(this: any, target: (...args: any[]) => any, _: any) {
	onDispose(() => target.call(this))
	return target
}

export function token<T>(_?: Token<T> | T, key?: string): Token<T> {
	if (key) {
		return Symbol.for(key)
	}
	return Symbol()
}