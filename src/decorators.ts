import { DecoratorUsageError } from './errors'
import { globalRegister } from './models/Module'
import { currScope } from './models/Scope'
import { Constructor, Lifetime } from './types'
import { getRegistration } from './utils'

const DISPOSABLES = Symbol.for('@wssz/di/disposables')

type DisposableHost = Record<PropertyKey, any>

function isDecoratorContext(value: unknown): value is DecoratorContext {
	return typeof value === 'object' && value !== null && 'kind' in value
}

export function injectable(lifetime: Lifetime = Lifetime.SCOPED) {
	return <T extends Constructor<any>>(constructor: T, context?: DecoratorContext): T => {
		if (isDecoratorContext(context) && context.kind !== 'class') {
			throw new DecoratorUsageError('injectable', 'class')
		}

		const record = getRegistration(constructor, lifetime)
		globalRegister.set(record.token, record)

		return constructor
	}
}

export function disposable<T extends (...args: any[]) => any>(
	value: T,
	context: ClassMethodDecoratorContext,
): T
export function disposable(
	target: object,
	propertyKey: PropertyKey,
	descriptor?: PropertyDescriptor,
): PropertyDescriptor | void
export function disposable(
	value: any,
	context?: DecoratorContext | PropertyKey,
	descriptor?: PropertyDescriptor,
): any {
	if (isDecoratorContext(context)) {
		return standardDisposable(value, context)
	}

	return legacyDisposable(value, context as PropertyKey, descriptor)
}

function standardDisposable(value: any, context: DecoratorContext) {
	if (context.kind !== 'method') {
		throw new DecoratorUsageError('disposable', 'method')
	}

	const methodContext = context as ClassMethodDecoratorContext<DisposableHost>
	const { name } = methodContext

	methodContext.addInitializer(function (this: DisposableHost) {
		currScope().onDispose(() => this[name]())
	})

	return value
}

function legacyDisposable(
	target: DisposableHost,
	propertyKey: PropertyKey,
	descriptor?: PropertyDescriptor,
) {
	const own: PropertyKey[] = Object.prototype.hasOwnProperty.call(target, DISPOSABLES)
		? target[DISPOSABLES]
		: (target[DISPOSABLES] = [...(target[DISPOSABLES] ?? [])])

	own.push(propertyKey)

	return descriptor
}

export function collectDisposables(instance: any): PropertyKey[] {
	if (instance === null || typeof instance !== 'object') {
		return []
	}

	return instance[DISPOSABLES] ?? []
}
