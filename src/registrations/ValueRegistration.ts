import { ValueProvider } from '../types'
import { Registration } from './Registration'

export class ValueRegistration<T> extends Registration<T, ValueProvider<T>> {
	get(): T {
		return this.register.useValue
	}
}