## @wssz/di

```ts
import { injectable, Lifetime, inject, createScope } from '@wssz/di'

@injectable(Lifetime.SINGLETON)
class Singleton {

}

@injectable()
class Service {
	singleton = inject(Singleton)
}

const scope = createScope(() => {
	inject(Service)
})

// on end
scope.dispose()

```