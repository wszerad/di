import { ValueProvider } from '../types'
import { Registration } from './Registration'

export class ValueRegistration<T> extends Registration<T, ValueProvider<T>> {
	protected extract(register: ValueProvider<T>) {
		return register.useValue
	}

	protected get(): T {
		return this.provider
	}
}