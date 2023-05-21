import { TokenRegister, Token } from './types'
import { Scope } from './Scope'
import { getCurrContext } from './Context'
import { getRegisterName } from './utils'

const levels: Token<any>[] = []
let deep = 0

export function inject<T>(token: Token<T>): T {
	const localeDeep = deep++
	levels[localeDeep] = token
	if (levels.includes(token)) {
		throw new Error(levels.map(getRegisterName).join(' -> '))
	}
	const context = getCurrContext()
	const result = context.scope.resolve(token, context)
	levels.splice(localeDeep, levels.length - localeDeep)
	return result
}

export function scope(registrations: TokenRegister<any>[] = []) {
	const scope = Scope.createScope(registrations)

	scope.register = scope.register.bind(scope)
	scope.resolve = scope.resolve.bind(scope)
	scope.dispose = scope.dispose.bind(scope)
	scope.scope = scope.scope.bind(scope)
	scope.injectable = scope.injectable.bind(scope)

	return scope
}

export function token<T>(_: Token<T> | T, key?: string): Token<T> {
	if (key) {
		return Symbol.for(key)
	}
	return Symbol()
}