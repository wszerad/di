import { isProduction } from 'std-env'
import { CircularInjectionError } from './errors'
import { globalRegister } from './models/Module'
import { currScopeResolve, getCurrScope } from './models/Scope'
import { ClassRegistration } from './registrations/ClassRegistration'
import { FactoryRegistration } from './registrations/FactoryRegistration'
import { Registration } from './registrations/Registration'
import { ValueRegistration } from './registrations/ValueRegistration'
import { Constructor, Disposable, Factory, Lifetime, RawProvider, RawValue, Token } from './types'
import { getRegistration, isLifetime } from './utils'

const levels: Token[] = []
let deep = 0

export function token<T>(_?: Token<T> | T, key?: string): Token<T> {
	if (key) {
		return Symbol.for(key)
	}
	return Symbol()
}

export function loopDetection(token: Token, action: () => any) {
	const localeDeep = deep++
	if (levels.includes(token)) {
		throw new CircularInjectionError([...levels, token])
	}
	levels[localeDeep] = token

	const result = action()
	levels.splice(localeDeep, levels.length - localeDeep)
	return result
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

export function dispose() {
	return getCurrScope().dispose()
}

export function injectable(lifetime: Lifetime = Lifetime.SCOPED) {
	return (constructor: Constructor<any>) => {
		const record = getRegistration(constructor, lifetime)
		globalRegister.set(record.token, record)
	}
}

export function bindValue<T>(value: RawValue<T>, token: Token<T>, lifetime?: Lifetime): Registration {
	return new ValueRegistration({
		token,
		provider: value,
		lifetime
	})
}

export function bindFactory<T>(factory: Factory<T>, token?: Token<T> | Lifetime, lifetime?: Lifetime): Registration {
	if (isLifetime(token)) {
		lifetime = token
		token = factory
	} else if (!token) {
		token = factory
	}

	return new FactoryRegistration({
		token,
		provider: factory,
		lifetime
	})
}

export function bindClass<T>(constructor: RawProvider<T>, token?: Token<T> | Lifetime, lifetime?: Lifetime): Registration {
	if (isLifetime(token)) {
		lifetime = token
		token = constructor
	} else if (!token) {
		token = constructor
	}

	return new ClassRegistration({
		token,
		provider: constructor,
		lifetime
	})
}
