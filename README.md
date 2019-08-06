# angular-hooks

Use [Vue Function API](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md) equivalent in Angular to enable composition functions in components:
- Better logical decomposition
- Reusable logic
- Can imitate inheritance but without its inconvenients

**Warning**: This is currently still experimental and unstable.

Though it is concerning Vue, here a comment from *Evan You* explaining the main advantages of composition functions.
https://github.com/vuejs/rfcs/issues/55#issuecomment-504875870

## TODO

- `state` function & unwrapping of wrappers in template
- add options `watch` to choose update mode:
  - `sync`: call watch handler synchroneously when a dependency has changed.
  - `pre`: call watch handler before rerendering
  - `post`: call watch handler after rerendering

## Install

1. Make sure Angular v6 or higher is installed.
2. Make sure RxJs v6 or higher is installed.

3. Install module:
`npm install angular-hooks --save`

## Usage

To use Angular Hooks, you need to first let your component inherit `UseHooks<T>` with `T` being your component. This allows us to add the necessary logic and typing to the component before it is executed.

To finish, you only need to add the `ngHooks` method to your component. The return value of this function will automatically be exposed on `this.$data`.

## Restrictions

- `ngHooks` needs to be synchroneous.
- All functions presented below are only available in `ngHooks`.

## Features

For now, there is no advanced description available for each function.
Each function therefore only links to an example using the feature.

Observables wrappers:
- [value](#example-setup)
- [observe](#example-inputs)
- [computed](#example-inputs)
- [watch](#example-route)

Automatic subscribe / unsuscribe:
- subscribe

Injector:
- [provide](#example-route)

Dynamic lifecycles:
- [onInit](#example-lifecycles)
- [onDestroy](#example-lifecycles)
- onAfterViewInit
- onAfterContentInit

## Example

### <a name="example-setup"></a> Setup

- `value` returns a new Wrapper with the given initial value.

```ts
import { value, UseHooks } from 'angular-hooks'

@Component({
  // ...
})
export class MyComponent extends UseHooks<MyComponent> {

  ngHooks() {
    const counter = value(0);

    return {
      counter
    };
  }
}
```

```html
<p>{{ $data.counter.value }}</p>
```

### <a name="example-inputs"></a> Reactive inputs

- `observe` turns a property on the given object into a reactive Wrapper.
- `computed` automatically recomputes it's value if one of it's dependencies has changed. It will also only recompute it's value when needed.

```ts
import { observe, computed, UseHooks } from 'angular-hooks'

@Component({
  // ...
})
export class MyComponent extends UseHooks<MyComponent> {
  @Input()
  title: string = "Hello world";

  ngHooks() {
    const title = observe(this, props => props.title);
    const reversedTitle = computed(() => {
      return title.value
        .split('')
        .reverse()
        .join('');
    })

    return {
      title,
      reversedTitle
    };
  }
}
```

```html
<h1>{{ $data.title.value }}</h1>
<h2>{{ $data.reversedTitle.value }}</h2>
```

### <a name="example-route"></a> Watch route

- `provide` makes use of Angulars `Injector` to get the appropriate provider.
- `fromObservable` turns an RxJs observable into a Wrapper.
- `asObservable` turns a Wrapper into an RxJs observable.
- `watch` observes a Wrapper and triggers the handler each time the Wrapper changes. Automatically unsubscribes when the component is destroyed.

```ts
import { value, provide, watch, fromObservable, UseHooks } from 'angular-hooks'
import { ActivatedRoute } from '@angular/router';

function useRoute() {
  const route = provide(ActivatedRoute);
  const params = fromObservable(router.params);
  return {
    params
  }
}

@Component({
  // ...
})
export class MyComponent extends UseHooks<MyComponent> {

  ngHooks() {
    const route = useRoute();
    const id = computed(() => route.params.value.id);

    const todo = value<any>(undefined);

    watch(id, async (value) => {
      const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${value}`);
      todo.value = await res.json();
    })

    return {
      id,
      todo
    };
  }
}
```

```html
<h1>{{ $data.id.value }}</h1>
<div *ngIf="$data.todo.value">
  <p>{{ $data.todo.value.title }}</p>
</div>
```

### <a name="example-lifecycles"></a> Dynamic lifecycle hooks

```ts
import { onInit, onDestroy, value } from 'angular-hooks'

function useMouse() {
  const x = value(0);
  const y = value(0);

  const update = (e: MouseEvent) => {
    x.value = e.pageX;
    y.value = e.pageY;
  };

  onInit(() => {
    window.addEventListener("mousemove", update, false);
  });
  onDestroy(() => {
    window.removeEventListener("mousemove", update, false);
  });

  return {
    x,
    y
  };
}

@Component({
  // ...
})
export class MyComponent extends UseHooks<MyComponent> {

  ngHooks() {
    return {
      ...useMouse()
    };
  }
}
```

```html
<p>{{ $data.x.value }} - {{ $data.y.value }}</p>
```

### How to replace inheritance

With inheritance:
```ts
class BaseComponent {
  public findData: any | undefined;
  public findError: Error | undefined;

  constructor(protected readonly myService: MyService) {}
  
  ngOnInit() {
    this.fetchData();
  }
  
  fetchData() {
    this.findError = undefined;
    this.myService.find().subscribe({
      next: (data: any) => {
         this.findData = data;
      },
      error: (err: any) => {
        this.findError = err;
      }
    })
  }
}

@Component({
  // ...
})
class MyComponent extends BaseComponent {
  ...
}
```

With hooks:
```
function useAsync<T>(fn: () => Observable<T>) {
  const data = value<T|undefined>(undefined);
  const error = value<any|undefined>(undefined);
  
  const execute = () => {
    error.value = undefined;
    fn().subscribe({
      next: (result: T) => {
         data.value = result;
      },
      error: (err: any) => {
        error.value = err;
      }
    })
  }
  
  return {
    data,
    error,
    execute
  }
}

function useMyServiceFind() {
  const myService = provide(MyService);
  return useAsync(() => myService.find());
}

@Component({
  // ...
})
export class MyComponent extends UseHooks<MyComponent> {

  ngHooks() {
    const { data: findData, error: findError, execute: fetchData } = useMyServiceFind();
    
    onInit(() => {
      fetchData();
    })

    return {
      findData,
      findError,
      fetchData
    };
  }
}
```

Advantages:
- Better visibility about what happens in your component
- `useAsync` is completely reusable

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
