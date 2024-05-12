import { Token } from './types'
import { getTokenName } from './utils'

export class DiError extends Error {}

export class CircularInjectionError extends DiError {
    constructor(tokens: Token[]) {
        super('Circular dependency injection: ' + tokens.map(getTokenName).join(' -> '))
    }
}

export class TokenNameError extends DiError {
    constructor() {
        super('Token name cannot be empty')
    }
}

export class UnknownTokenError extends DiError {
    constructor(token: Token) {
        super(`Unknown token: ${getTokenName(token)}`)
    }
}

export class UnknownGlobalTokenError extends DiError {
    constructor(token: Token) {
        super(`Unknown token in global module: ${getTokenName(token)}. Make sure that singleton dependencies also are globally defined`)
    }
}