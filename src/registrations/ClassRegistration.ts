import { ClassProvider, Lifetime, Registration, Token } from '../types'

export class ClassRegistration<T> implements Registration<T> {
	token: Token<T>
	lifetime: Lifetime

	constructor(
		public register: ClassProvider<T>,
		lifetime: Lifetime
	) {
		this.token = register.token
		this.lifetime = register.lifetime || lifetime
	}

	get(): T {
		return new this.register.useClass()
	}
}