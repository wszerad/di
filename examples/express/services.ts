import { inject, Lifetime, scope, onDispose } from '../../src'
export const globalScope = scope()
const { injectable } = globalScope

@injectable(Lifetime.SINGLETON)
class Db {
	values = new Map<string | number, any>()

	get(key: string | number) {
		return this.values.get(key)
	}

	set(key: string | number, value: any) {
		this.values.set(key, value)
	}
}

@injectable(Lifetime.TRANSIENT)
export class User {
	db = inject(Db)
	uuid
	session: Record<any, any>

	constructor(req: any, res: any) {
		const sessionId = req.cookies.session

		if (sessionId) {
			this.uuid = sessionId
			this.session = this.db.get(sessionId)
		} else {
			this.uuid = Math.random()
			this.session = {}
			res.cookie('session', this.uuid)
		}

		onDispose(this.saveSession)
	}

	saveSession() {
		this.db.set(this.uuid, this.session)
	}
}
