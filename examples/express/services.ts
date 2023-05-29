import { inject, Lifetime, injectable, onDispose } from '../../src'

@injectable(Lifetime.SINGLETON)
class Db {
	values = new Map<string | number, any>()

	constructor() {
		onDispose(() => {
			console.log('shutdown DB')
		})
	}

	get(key: string | number) {
		return this.values.get(key)
	}

	set(key: string | number, value: any) {
		this.values.set(key, value)
	}
}

export class User {
	db = inject(Db)
	uuid
	session: Record<any, any>

	constructor(req: any, res: any) {
		const sessionId = req.cookies.session

		if (sessionId) {
			this.uuid = sessionId
			this.session = this.db.get(sessionId) || {}
		} else {
			this.uuid = Math.random()
			this.session = {}
			res.cookie('session', this.uuid)
		}

		onDispose(() => this.saveSession())
	}

	saveSession() {
		console.log('session save')
		this.db.set(this.uuid, this.session)
	}
}
