import { FactoryProvider, Lifetime, Registration, Token } from '../types'

export class FactoryRegistration<T> implements Registration<T> {
	token: Token<T>
	lifetime: Lifetime

	constructor(
		public register: FactoryProvider<T>,
		lifetime: Lifetime
	) {
		this.token = register.token
		this.lifetime = register.lifetime || lifetime
	}

	get(): T {
		return this.register.useFactory()
	}
}