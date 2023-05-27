import { Token } from './types'
import { getTokenName } from './utils'

export class DiError extends Error {}

export class CircularInjectionError extends DiError {
    constructor(tokens: Token<any>[]) {
        super('Circular dependency injection: ' + tokens.map(getTokenName).join(' -> '))
    }
}

export class TokenOverwriteError extends DiError {
    constructor(name: string) {
        super(`Token with name: ${name} is already registered`)
    }
}

export class FrozenScopeError extends DiError {
    constructor() {
        super('Module is frozen by child-scope or usage. No additional registration can be made')
    }
}

export class TokenNameError extends DiError {
    constructor() {
        super('Token name cannot be empty')
    }
}

export class UnknownTokenError extends DiError {
    constructor(token: Token<any>) {
        super(`Unknown token: ${getTokenName(token)}`)
    }
}