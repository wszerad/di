import express from 'express'
import cookieParser from 'cookie-parser'
import { User, globalScope } from './services'
import { Context } from '../../src'

const router = express.Router()

router.get('/:path', (req: any, res: any) => {
	req.json()
	res.json(req.user.session)
})

const app = express()
app.use(cookieParser())
app.use((req, res, next) => {
	const context = new Context(globalScope)
	const user = globalScope.resolve(User, context)
	req.user = user

	res.once('finish', () => {
		context.dispose()
	})

	next()
})
app.use(router)
app.listen(3000)