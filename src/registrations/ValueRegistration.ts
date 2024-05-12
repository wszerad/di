import { Registration } from './Registration'

export class ValueRegistration<T> extends Registration<T> {
	protected get(): T {
		return this.provider
	}
}