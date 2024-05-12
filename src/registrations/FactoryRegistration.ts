import { Registration } from './Registration'

export class FactoryRegistration<T> extends Registration<T> {
	protected get(): T {
		return this.provider()
	}
}