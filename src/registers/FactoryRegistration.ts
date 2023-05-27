import { FactoryProvider, Lifetime } from '../types'
import { TokenRegistration } from './TokenRegistration.ts'

export class FactoryRegistration<T> extends TokenRegistration<T> {
	constructor(
		public register: FactoryProvider<T>,
		lifetime: Lifetime
	) {
		super(register, lifetime)
	}

	get(): T {
		return this.register.useFactory()
	}
}