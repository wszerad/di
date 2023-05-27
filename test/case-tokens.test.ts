import { inject, scope, token } from '../src/index'

const { register, resolve } = scope()

class Class {
	class = true
}

function factory() {
	return {
		factory: inject(Class)
	}
}

const value = {
	value: true
}

register(Class)
register(factory)

const valueToken = token(value)
register({
	token: valueToken,
	useValue: value
})

const classToken = token(Class)
register({
	token: classToken,
	useClass: Class
})

const factoryToken = token(factory)
register({
	token: factoryToken,
	useFactory: factory
})

describe('case tokens', () => {
	it('should resolve class instance', () => {
		const value = resolve(Class)
		expect(value.class).toBe(true)
	})

	it('should resolve factory instance', () => {
		const value = resolve(factory)
		expect(value.factory.class).toBe(true)
	})

	it('should resolve class instances from token', () => {
		const value = resolve(classToken)
		expect(value.class).toBe(true)
	})

	it('should resolve factory instance from token', () => {
		const value = resolve(factoryToken)
		expect(value.factory.class).toBe(true)
	})

	it('should resolve value from token', () => {
		const value = resolve(valueToken)
		expect(value.value).toBe(true)
	})
})