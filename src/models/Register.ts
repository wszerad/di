import { Lifetime, Provider, Token } from '../types'
import { TokenNameError, UnknownTokenError } from '../errors'
import { isClassProvider, isFactoryProvider, isRawClass, isRawFactory, isValueProvider } from '../utils'
import { ClassRegistration } from '../registrations/ClassRegistration'
import { FactoryRegistration } from '../registrations/FactoryRegistration'
import { ValueRegistration } from '../registrations/ValueRegistration'
import { Registration } from '../registrations/Registration'

export class Register {
	private readonly records: Map<Token, Registration> = new Map()
	private readonly registers: Register[] = []

	constructor(
		registrations: (Register | Provider<any>)[] = []
	) {
		for (const entry of registrations) {
			if (entry instanceof Register) {
				this.registers.push(entry)
				continue
			}

			const t = this.getRegistration(entry)
			this.records.set(t.token, t)
		}
	}

	private getRegistration(provider: Provider<any>, lifetime: Lifetime = Lifetime.SCOPED) {
		if (isRawFactory(provider)) {
			return new FactoryRegistration({
				token: provider,
				useFactory: provider
			}, lifetime)
		}

		if (isRawClass(provider)) {
			return new ClassRegistration({
				token: provider,
				useClass: provider
			}, lifetime)
		}

		if (isValueProvider(provider)) {
			return new ValueRegistration(provider, lifetime)
		}

		if (isFactoryProvider(provider)) {
			return new FactoryRegistration(provider, lifetime)
		}

		if (isClassProvider(provider)) {
			return new ClassRegistration(provider, lifetime)
		}

		throw new UnknownTokenError(provider)
	}

	get<T>(token: Token<T>): Registration<T> {
		const registration = this.records.get(token)

		for (const register of this.registers) {
			const result = register.get(token)

			if (!result) {
				continue
			}

			return result
		}

		if (!registration) {
			throw new UnknownTokenError(token)
		}

		return registration
	}

	set<T>(provider: Provider<T>, lifetime: Lifetime) {
		const registration = this.getRegistration(provider, lifetime)

		if (!registration.token) {
			throw new TokenNameError()
		}

		this.records.set(registration.token, registration)
		return this
	}
}
