import { ClassProvider } from '../types'
import { Registration } from './Registration'

export class ClassRegistration<T> extends Registration<T, ClassProvider<T>> {
	protected extract(register: ClassProvider<T>) {
		return register.useClass
	}

	protected get(): T {
		return new this.provider()
	}
}