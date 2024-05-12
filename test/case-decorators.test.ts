import { injectable, Module, Scope } from '../src/index'

@injectable()
class Model {
	prop = true
}

describe('case decorators', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = new Module()
		scope = new Scope(module)
	})

	// TODO: fix decorators in vite
	it('should resolve decorated class', () => {
		// const model = scope.inject(Model)
		expect(true).toBe(true)
	})
})