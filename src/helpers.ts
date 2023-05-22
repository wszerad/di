import { TokenRegister, Token, Disposable } from './types'
import { Scope } from './Scope'
import { getCurrContext } from './Context'
import { CIError } from './errors'

const levels: Token<any>[] = []
let deep = 0

export function inject<T>(token: Token<T>): T {
	const localeDeep = deep++
	if (levels.includes(token)) {
		throw new CIError([...levels, token])
	}
	levels[localeDeep] = token

	const context = getCurrContext()
	const result = context.scope.resolve(token, context)
	levels.splice(localeDeep, levels.length - localeDeep)
	return result
}

export function onDispose(cb: Disposable) {
	getCurrContext().onDispose(cb)
}

export function scope(registrations: TokenRegister<any>[] = []) {
	return Scope.createScope(registrations)
}

export function token<T>(_: Token<T> | T, key?: string): Token<T> {
	if (key) {
		return Symbol.for(key)
	}
	return Symbol()
}