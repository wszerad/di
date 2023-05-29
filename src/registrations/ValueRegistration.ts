import { Lifetime, Registration, Token, ValueProvider } from '../types'

export class ValueRegistration<T> implements Registration<T> {
	token: Token<T>
	lifetime: Lifetime

	constructor(
		public register: ValueProvider<T>,
		lifetime: Lifetime
	) {
		this.token = register.token
		this.lifetime = register.lifetime || lifetime
	}

	get(): T {
		return this.register.useValue
	}
}