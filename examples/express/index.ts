import express from 'express'
import cookieParser from 'cookie-parser'
import { RequestToken, ResponseToken, User } from './services'
import { globalModule, Scope } from '../../src'

const router = express.Router()

router.get('/:path', (req: any, res: any) => {
	req.user.session[req.params.path] = (req.user.session[req.params.path] || 0) + 1
	res.json(req.user.session)
})

const app = express()
app.use(cookieParser())
app.use((req: any, res, next) => {
	const module = globalModule.extend([
		{
			token: RequestToken,
			useValue: req
		},
		{
			token: ResponseToken,
			useValue: res
		}
	])

	const scope = new Scope(module)
	req.user = scope.inject(User)

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
		await globalModule.dispose()
		console.log('module disposed')
	})
}

process.once('SIGINT', handleShutdown)
process.once('SIGTERM', handleShutdown)
process.once('SIGBREAK', handleShutdown)

function end() {
	server.close()
	console.log('restart')
}

if (import.meta.hot) {
	import.meta.hot.on('vite:beforeFullReload', end);
	import.meta.hot.dispose(end);
}