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
		module = Module.create()
		module.extend(Class)
		scope = module.createScope()
	})

	it('should resolve overwritten class', () => {
		const value1 = scope.inject(Class)
		const newModule = Module.create([
			module,
			{
				token: Class,
				useClass: ClassOverwrite
			}
		])

		const newScope = newModule.createScope()
		const value2 = newScope.inject(Class)
		expect(value1.class).toBe(true)
		expect(value2.class).toBe(false)
	})

	it('should fail to register if child scope created', () => {
		Module.create([
			module
		])

		expect(() => {
			module.extend({
				token: token(Class),
				useClass: ClassOverwrite
			})
		}).toThrowError('frozen')
	})

	it('should fail to register if already resolved', () => {
		scope.inject(Class)

		expect(() => {
			module.extend({
				token: token(Class),
				useClass: ClassOverwrite
			})
		}).toThrowError('frozen')
	})
})