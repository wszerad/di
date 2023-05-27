import { Lifetime, Token, TokenProvider } from '../types'
import { Registration } from './Registration'

export abstract class TokenRegistration<T> implements Registration<T> {
	lifetime: Lifetime
	token: Token<T>

	constructor(
		public register: TokenProvider<T>,
		lifetime: Lifetime
	) {
		this.lifetime = register.lifetime || lifetime
		this.token = register.token
	}

	abstract get(): T
}