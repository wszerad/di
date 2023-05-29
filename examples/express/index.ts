import express from 'express'
import cookieParser from 'cookie-parser'
import { User } from './services'
import { createScope, disposeModule } from '../../src'

const router = express.Router()

router.get('/:path', (req: any, res: any) => {
	req.user.session[req.params.path] = (req.user.session[req.params.path] || 0) + 1
	res.json(req.user.session)
})

const app = express()
app.use(cookieParser())
app.use((req, res, next) => {
	const scope = createScope(() => {
		(req as any).user = new User(req, res)
	})

	res.once('finish', () => {
		scope.dispose()
	})

	next()
})
app.use(router)
const server = app.listen(3000)

function handleShutdown() {
	console.log('shutdown started')
	server.close(async () => {
		await disposeModule()
		console.log('module disposed')
	})
}

process.once('SIGINT', handleShutdown)
process.once('SIGTERM', handleShutdown)
process.once('SIGBREAK', handleShutdown)
