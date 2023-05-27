import {
	Lifetime,
	Provider,
	Token,
	TokenProvider
} from './types'
import { Registration } from './Registration'
import { FrozenScopeError, TokenNameError, TokenOverwriteError, UnknownTokenError } from './errors'
import { getTokenName, isConstructor, isFunction } from './utils'
import { ClassRegistration } from './registers/ClassRegistration'
import { FactoryRegistration } from './registers/FactoryRegistration'
import { RawClassRegistration } from './registers/RawClassRegistration'
import { RawFactoryRegistration } from './registers/RawFactoryRegistration'
import { ValueRegistration } from './registers/ValueRegistration'


export class Register {
	public register: Map<Token<any>, Registration<any>>
	public locked = false

	constructor(registrations: [Token<any>, Registration<any>][] = []) {
		this.register = new Map(registrations)
	}

	private getTokenProviderType(register: Provider<any>, lifetime: Lifetime) {
		if (register.hasOwnProperty('useValue')) {
			return new ValueRegistration(register, lifetime)
		}
		if (register.hasOwnProperty('useFactory')) {
			return new FactoryRegistration(register, lifetime)
		}
		return new ClassRegistration(register, lifetime)
	}

	private getProviderType(register: Provider<any>, lifetime: Lifetime) {
		if (isFunction(register)) {
			return isConstructor(register)
				? new RawClassRegistration(register, lifetime)
				: new RawFactoryRegistration(register, lifetime)
		}

		return this.getTokenProviderType(register, lifetime)
	}

	get<T>(token: Token<T>): Registration<T> {
		const registration = this.register.get(token)

		if (!registration) {
			throw new UnknownTokenError(token)
		}

		return registration
	}

	registration<T>(provider: Provider<T>, lifetime: Lifetime = Lifetime.SCOPED) {
		if (this.locked) {
			throw new FrozenScopeError()
		}

		const registration = this.getProviderType(provider, lifetime)

		if (!registration.token) {
			throw new TokenNameError()
		}

		if (this.register.has(registration.token)) {
			throw new TokenOverwriteError(getTokenName(registration.token))
		}

		this.register.set(registration.token, registration)
		return this
	}

	createChildRegister(registrations: (TokenProvider<any> | Register)[] = []) {
		const mergedRegistration: [Token<any>, Registration<any>][] = []

		registrations.forEach(item => {
			if (item instanceof Register) {
				mergedRegistration.push(...item.register.entries())
				item.locked = true
				return
			}

			const registration = new Registration(item)
			mergedRegistration.push([registration.token, registration])
		})

		return new Register(mergedRegistration)
	}
}

export const globalRegister = new Register()