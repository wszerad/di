import { injectable, Module, Scope } from '../src/index'

@injectable()
class Model {
	prop = true
}

describe('case decorators', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = new Module([Model])
		scope = new Scope(module)
	})

	it('should resolve decorated class', () => {
		const model = scope.inject(Model)
		expect(model.prop).toBe(true)
	})
})
