import { Token, Disposable, Lifetime, Constructor } from './types'
import { getCurrContext } from './Context'
import { CircularInjectionError } from './errors'
import { isDevelop } from './utils'
import { globalRegister } from './Register'

const levels: Token<any>[] = []
let deep = 0

function loopDetection(action: () => any) {
	const localeDeep = deep++
	if (levels.includes(token)) {
		throw new CircularInjectionError([...levels, token])
	}
	levels[localeDeep] = token

	const result = action()
	levels.splice(localeDeep, levels.length - localeDeep)
	return result
}

function currContextResolve<T>(token: Token<T>): T {
	const context = getCurrContext()
	return context.resolve(token)
}

export function inject<T>(token: Token<T>): T {
	if (isDevelop) {
		return loopDetection(() => currContextResolve(token))
	}

	return currContextResolve(token)
}

export function onDispose(cb: Disposable) {
	getCurrContext().onDispose(cb)
}

export function injectable<T>(lifetime: Lifetime = Lifetime.SCOPED) {
	return (constructor: Constructor<T>) => {
		globalRegister.registration(constructor, lifetime)
	}
}

export function token<T>(_: Token<T> | T, key?: string): Token<T> {
	if (key) {
		return Symbol.for(key)
	}
	return Symbol()
}