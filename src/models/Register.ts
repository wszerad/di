import { Lifetime, Provider, Registration, Token } from '../types'
import { TokenNameError, TokenOverwriteError, UnknownTokenError } from '../errors'
import { getTokenName, isClassProvider, isFactoryProvider, isRawClass, isRawFactory, isValueProvider } from '../utils'
import { ClassRegistration } from '../registrations/ClassRegistration'
import { FactoryRegistration } from '../registrations/FactoryRegistration'
import { ValueRegistration } from '../registrations/ValueRegistration'

export class Register {
	private records: Map<Token<any>, Registration<any>>

	constructor(registrations: (Register | Provider<any>)[] = []) {
		const records: [Token<any>, Registration][] = []
		registrations
			.forEach(item => {
				if (item instanceof Register) {
					records.push(...item.records.entries())
					return
				}

				const t = this.getRegistration(item)
				records.push([t.token, t])
			})
		this.records = new Map(records)
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

		if (this.records.has(registration.token)) {
			throw new TokenOverwriteError(getTokenName(registration.token))
		}

		this.records.set(registration.token, registration)
		return this
	}
}
