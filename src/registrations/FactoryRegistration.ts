import { FactoryProvider } from '../types'
import { Registration } from './Registration'

export class FactoryRegistration<T> extends Registration<T, FactoryProvider<T>> {
	protected extract(register: FactoryProvider<T>) {
		return register.useFactory
	}

	protected get(): T {
		return this.provider()
	}
}