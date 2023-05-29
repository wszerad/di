import { Module, Scope } from '../src/index'

describe('case decorators', () => {
	let module: Module
	let context: Scope

	beforeEach(() => {
		module = new Module()
		context = module.createScope()
	})

	it('should resolve decorated class', () => {
		@module.injectable()
		class Model {
			prop = true
		}

		const model = context.inject(Model)
		expect(model.prop).toBe(true)
	})
})