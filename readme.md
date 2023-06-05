# @wssz/di
DI (dependency injection) lib. No external dependencies, cross-env with optional decorator API.

## Example

```typescript
@injectable()
class Service {
  method() {
    return 2
  }
	
  @dispose
  onDispose() {
    console.log('Disposed')
  }
}

const serviceInstance = resolve(Service)
serviceInstance.method() // -> 2
///
class ServiceMock {
  method() {
    return 4
  }
}

const module = extendModule([
  {
    token: Service,
    useClass: ServiceMock
  }
])

const serviceMockInstance = module.resolve(Service)
serviceMockInstance.method() // -> 4
```

## Functions

### inject(`token: Token<T>`)
`inject` provide injector for current scope.

### token(`value?: T, key?: string`): `Token<T>`

### onDispose(`() => void`)
Dispose hook for current scope.

### extendModule(`registrations: (Provider<any> | Module)[] = []`)
`extend` method of globalModule.

### resetModule()
`reset` method of globalModule.

### provide(`provider: Provider<any>, lifetime = Lifetime.SCOPED`)
`provide` method of globalModule.

### resolve(`token: Token<T>, scope = new Scope(this)`)
`resolve` method of globalModule.

## Decorators

### @injectable()
Register class for globalModule
```ts
@injectable()
class Service {}

const serviceInstance = resolve(Service)
```

### @dispose
Mark method as onDispose

```ts
@injectable()
class Service {

  constructor() {
    // one way
    onDispose(() => this.onDispose())
  }

  // secound way
  @dispose
  onDispose() {
    console.log('disposed')
  }
}

const serviceInstance = resolve(Service)
```

## Module

### new Module(`registrations: (Provider<any> | Module)[] = [], rootScope?: Scope`)

### module.resolve(`token: Token<T>, scope = new Scope(this)`): `T`

##### Usage

```typescript
class Service {
	say() {
		console.log('Hello from service')
	}
}

const module = new Module([ Service ])
const serviceInstance = module.resolve(Service)
```
### module.reset(): `Promise<void>`
Reset singleton cache and trigger onDispose hook inside existing ones

##### Usage

```typescript
@injectable(Lifetime.SINGLETON)
class Signleton {
	constructor() {
		console.log('Singleton create')
		onDispose(() => {
			console.log('Singleton dispose')
		})
	}
}

const module = createModule([ Signleton ])

module.resolve(Singleton) // -> 'Singleton create'
module.resolve(Singleton) // sigleton already exists, no messages
await module.reset() // -> 'Singleton dispose'
module.resolve(Singleton) // -> 'Singleton create'
```

### module.injectable(`lifetime = Lifetime.SCOPED`)
Method used for @injectable decorator.

##### Usage
```typescript
const module = new Module()
@module.injectable(Lifetime.SINGLETON) // @injectable is for globalModule
class Signleton {}
```

### module.provide(`provider: Provider<any>, lifetime = Lifetime.SCOPED`)
Alternative for @injectable, usable for factories or values.

#####  Usage
```typescript
const module = createModule()

interface Config {
  url: string
}
const ConfigToken = token<Config>()

module.provide({
  token: ConfigToken,
  useValue: {
    url: 'http://localhost:3000'
  }
})
```

### module.extend(`registrations: (Provider<any> | Module)[] = []`)
Creates copy of module and all providers.

#####  Usage
```typescript
const module = new Module()

interface Config {
  url: string
}

const ConfigToken = token<Config>()

module.provide({
  token: ConfigToken,
  useValue: {
    url: 'http://localhost:3000'
  }
})

const moduleWithDifferentConfig = module.extend([
  {
    token: ConfigToken,
    useValue: {
      url: 'http://localhost:8080'
    }
  }
])
```

## Scope
Scope contain cached values for providers registered in module. Gives possibility to dispose services created in scope. 
### new Scope(module: Module): `Scope`
##### Usage
```typescript
const module = new Mdoule()
const scope = new Scope(module)
```

### scope.onDispose(`cb: () => void`)
Hook triggered when scope is disposed.

##### Usage

```typescript
@injectable()
class Service {
  constructor() {
  // scope.onDispose of current scope
    onDispose(() => {
      console.log('disposed')
    })
  }
}

const scope = new Scope(globalModule)
scope.onDispose(() => {
  console.log('disposed')
})
scope.dispose() // -> 'disposed'

```
### scope.inject(`token: Token<T>`): `T`
Resolve value registered in module or cached in scope if exists.

##### Usage

```typescript
class Service {}

const module = new Module([ Service ])
const scope = new Scope(module)

const service = scope.inject(Service) // or module.resolve(Service, scope)
```

### scope.dispose(): `Promise<void>`
Dispose current scope, all registered onDispose hook will be triggered.

##### Usage

```typescript
class Service {
  constructor() {
    onDispose(() => {
      return new Promise(res => {
        setTimeout(res, 1000)
      })
    })
  }
}

const module = new Module([Service])
const scope = new Scope(module)
const service = scope.inject(Service) // create instance for future dispose

await scope.dispose() // wait for all onDispose hooks end
```

