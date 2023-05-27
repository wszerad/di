import { TokenProvider } from './types'
import { Context } from './Context'
import { globalRegister, Register } from './Register'

export class Module {
	singletonsContext: Context = new Context(this)

	constructor(
		public register: Register = new Register(),
	) {}

	async dispose() {
		const disposedContext = this.singletonsContext
		this.singletonsContext = new Context(this)
		await disposedContext.dispose()
	}

	createContext() {
		return new Context(this)
	}

	static create(registrations: (TokenProvider<any> | Register)[] = []) {
		return new Module(globalRegister.createChildRegister(registrations))
	}
}