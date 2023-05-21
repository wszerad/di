import { Constructor, Lifetime, Register, Token, TokenRegister } from './types'
import { Registration } from './Registration'
import { Context } from './Context'

export class Scope {
	private singletonsContext: Context = new Context(this)

	constructor(
		private registration = new Map<Token<any>, Registration<any>>()
	) {}

	private registrationToEntries(registrations: TokenRegister<any>[]): [Token<any>, Registration<any>][] {
		return registrations.map(item => {
			const registration = new Registration(item)
			return [registration.token, registration]
		})
	}

	resolve<T>(token: Token<T>, context: Context = new Context(this)): T {
		const registration = this.registration.get(token)!

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return registration.factory()
		}

		if (registration.lifetime === Lifetime.SCOPED) {
			return context.getValue(registration)
		}

		return this.singletonsContext.getValue(registration)
	}

	injectable<T>(lifetime: Lifetime = Lifetime.SCOPED) {
		return (constructor: Constructor<T>) => {
			this.register(constructor, lifetime)
		}
	}

	register<T>(provider: Register<T>, lifetime: Lifetime = Lifetime.SCOPED): Scope {
		const registration = new Registration(provider, lifetime)
		this.registration.set(registration.token, registration)
		return this
	}

	scope(registrations: TokenRegister<any>[] = []): Scope {
		const merged = new Map<Token<any>, Registration<any>>([
			...this.registration.entries(),
			...this.registrationToEntries(registrations)
		])

		return new Scope(merged)
	}

	dispose() {
		this.singletonsContext.dispose()
		this.singletonsContext = new Context(this)
	}

	static createScope(registrations: TokenRegister<any>[] = []) {
		return new Scope(
			new Map(Scope.prototype.registrationToEntries(registrations))
		)
	}
}