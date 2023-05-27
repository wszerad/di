import {
	Lifetime,
	Token
} from '../types'

export interface Registration<T = any> {
	token: Token<T>
	lifetime: Lifetime
	get(): T
}
