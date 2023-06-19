import { FactoryProvider } from '../types'
import { Registration } from './Registration'

export class FactoryRegistration<T> extends Registration<T, FactoryProvider<T>> {
	get(): T {
		return this.register.useFactory()
	}
}