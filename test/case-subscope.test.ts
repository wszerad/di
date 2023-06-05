import { Scope, Module, token } from '../src/index'

class Class {
	class = true
}

class ClassOverwrite {
	class = false
}

describe('case subscope', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = new Module()
		module.provide(Class)
		scope = new Scope(module)
	})

	it('should resolve overwritten class', () => {
		const value1 = scope.inject(Class)
		const newModule = new Module([
			module,
			{
				token: Class,
				useClass: ClassOverwrite
			}
		])

		const newScope = new Scope(newModule)
		const value2 = newScope.inject(Class)
		expect(value1.class).toBe(true)
		expect(value2.class).toBe(false)
	})

	it('should fail to register if child scope created', () => {
		new Module([
			module
		])

		expect(() => {
			module.provide({
				token: token(Class),
				useClass: ClassOverwrite
			})
		}).toThrowError('frozen')
	})

	it('should fail to register if already resolved', () => {
		scope.inject(Class)

		expect(() => {
			module.provide({
				token: token(Class),
				useClass: ClassOverwrite
			})
		}).toThrowError('frozen')
	})
})