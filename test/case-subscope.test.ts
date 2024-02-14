import { Scope, Module } from '../src/index'

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
		module = new Module([
			Class
		])
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
})
