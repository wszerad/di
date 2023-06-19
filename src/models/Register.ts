import { Lifetime, Provider, Token } from '../types'
import { TokenNameError, TokenOverwriteError, UnknownTokenError } from '../errors'
import { getTokenName, isClassProvider, isFactoryProvider, isRawClass, isRawFactory, isValueProvider } from '../utils'
import { ClassRegistration } from '../registrations/ClassRegistration'
import { FactoryRegistration } from '../registrations/FactoryRegistration'
import { ValueRegistration } from '../registrations/ValueRegistration'
import { Registration } from '../registrations/Registration'

export class Register {
	private readonly records: Map<Token, Registration>

	constructor(
		registrations: (Register | Provider<any>)[] = [],
		isolated = false
	) {
		const records: [Token, Registration][] = []
		// TODO recreate singleton providers and add test
		const entries = registrations
			.reduce((acc, item) => {
				if (item instanceof Register) {
					acc.push(...item.records.entries())
					return acc
				}

				const t = this.getRegistration(item)
				acc.push([t.token, t])
				return acc
			}, records)
			.map(record => {
				if (isolated && record[1].lifetime === Lifetime.SINGLETON) {
					const { value, ...params } = record[1]
					const Constructor: any = record[1].constructor
					return new Constructor(params, params.lifetime)
				}
				return record
			})

		this.records = new Map(entries)
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
