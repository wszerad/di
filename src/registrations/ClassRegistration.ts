import { Registration } from './Registration'

export class ClassRegistration<T> extends Registration<T> {
	protected get(): T {
		return new this.provider()
	}
}