import { Scope, inject, Module, token } from '../src/index'

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

const valueToken = token(value)

const classToken = token(Class)

const factoryToken = token(factory)

describe('case tokens', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = new Module()
		module.provide(Class)
		module.provide(factory)
		module.provide({
			token: valueToken,
			useValue: value
		})
		module.provide({
			token: classToken,
			useClass: Class
		})
		module.provide({
			token: factoryToken,
			useFactory: factory
		})
		scope = new Scope(module)
	})

	it('should resolve class instance', () => {
		const value = scope.inject(Class)
		expect(value.class).toBe(true)
	})

	it('should resolve factory instance', () => {
		const value = scope.inject(factory)
		expect(value.factory.class).toBe(true)
	})

	it('should resolve class instances from token', () => {
		const value = scope.inject(classToken)
		expect(value.class).toBe(true)
	})

	it('should resolve factory instance from token', () => {
		const value = scope.inject(factoryToken)
		expect(value.factory.class).toBe(true)
	})

	it('should resolve value from token', () => {
		const value = scope.inject(valueToken)
		expect(value.value).toBe(true)
	})
})