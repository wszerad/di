import { ClassProvider } from '../types'
import { Registration } from './Registration'

export class ClassRegistration<T> extends Registration<T, ClassProvider<T>> {
	get(): T {
		return new this.register.useClass()
	}
}