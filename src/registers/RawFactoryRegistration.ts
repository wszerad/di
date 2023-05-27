import { Registration } from './Registration'
import { Factory, Lifetime, Token } from '../types'

export class RawFactoryRegistration<T> implements Registration<T> {
	token: Token<T>

	constructor(
		public register: Factory<T>,
		public lifetime: Lifetime
	) {
		this.token = register
	}

	get(): T {
		return this.register()
	}
}