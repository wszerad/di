import { Module, Scope } from '../src/index'

describe('case decorators', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = new Module()
		scope = new Scope(module)
	})

	it('should resolve decorated class', () => {
		@module.injectable()
		class Model {
			prop = true
		}

		const model = scope.inject(Model)
		expect(model.prop).toBe(true)
	})
})