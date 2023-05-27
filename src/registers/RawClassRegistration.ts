import { Registration } from './Registration'
import { Constructor, Lifetime, Token } from '../types'

export class RawClassRegistration<T> implements Registration<T> {
	token: Token<T>

	constructor(
		public register: Constructor<T>,
		public lifetime: Lifetime
	) {
		this.token = register
	}

	get(): T {
		return new this.register()
	}
}