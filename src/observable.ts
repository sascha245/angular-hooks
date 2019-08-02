import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';

import { subscribe } from './subscribe';
import { Wrapper } from './types';

interface InternalWrapper<T = any> extends Wrapper<T> {
  __vNeedUpdate: Subject<void>;
}

let deps: InternalWrapper[] = [];
let isRecordingDeps: boolean = false;

const startDeps = () => {
  isRecordingDeps = true;
  deps = [];
};

const addDep = (wrapper: InternalWrapper) => {
  if (isRecordingDeps) {
    deps.push(wrapper);
  }
};
const getDeps = () => {
  return deps;
};

const resetDeps = () => {
  isRecordingDeps = false;
  deps = [];
};

export interface GetterSetterOptions<T> {
  get: () => T;
  set?: (val: T) => void;
}
export type GetterFunction<T> = () => T;

function createWrapper<T>(
  val: BehaviorSubject<T>,
  options: GetterSetterOptions<T>
): InternalWrapper<T> {
  const ref = Object.create(Object.create(null), {
    __vNeedUpdate: {
      configurable: false,
      writable: false,
      value: new Subject<void>()
    },
    value: {
      configurable: false,
      get: options.get,
      set: options.set
    }
  });

  return ref;
}

export function value<T = any>(initial: T): Wrapper<T> {
  const val = new BehaviorSubject(initial);
  const ref = createWrapper(val, {
    get() {
      addDep(ref);
      return val.value;
    },
    set(newValue: T) {
      val.next(newValue);
      ref.__vNeedUpdate.next();
    }
  });

  return ref;
}

export function computed<T>(fn: () => T): Wrapper<T>;
export function computed<T>(options: GetterSetterOptions<T>): Wrapper<T>;
export function computed<T>(optionsOrFn: (() => T) | GetterSetterOptions<T>): Wrapper<T> {
  let options: GetterSetterOptions<T>;
  if (typeof optionsOrFn === 'function') {
    options = {
      get: optionsOrFn,
      set: undefined
    };
  } else {
    options = optionsOrFn;
  }

  startDeps();
  const initial = options.get();
  const val = new BehaviorSubject<T>(initial);
  const deps = getDeps();
  resetDeps();

  let dirty = false;
  const ref = createWrapper(val, {
    get() {
      addDep(ref);
      if (dirty) {
        val.next(options.get());
        dirty = false;
      }
      return val.value;
    }
  });

  const needUpdate = deps.map(dep => dep.__vNeedUpdate);
  subscribe(combineLatest(...needUpdate), () => {
    dirty = true;
    ref.__vNeedUpdate.next();
  });

  return ref;
}

export type Watchable<T> = Wrapper<T> | GetterFunction<T>;
export type WatchFn<T> = (newValue: T, oldValue: T) => void;
export type WatchStop = () => void;

export function watch<T>(source: Watchable<T>, fn: WatchFn<T>): WatchStop;
export function watch<T1>(source: [Watchable<T1>], fn: WatchFn<[T1]>): WatchStop;
export function watch<T1, T2>(
  source: [Watchable<T1>, Watchable<T2>],
  fn: WatchFn<[T1, T2]>
): WatchStop;
export function watch<T1, T2, T3>(
  source: [Watchable<T1>, Watchable<T2>, Watchable<T3>],
  fn: WatchFn<[T1, T2, T3]>
): WatchStop;
export function watch<T1, T2, T3, T4>(
  source: [Watchable<T1>, Watchable<T2>, Watchable<T3>, Watchable<T4>],
  fn: WatchFn<[T1, T2, T3, T4]>
): WatchStop;
export function watch<T1, T2, T3, T4, T5>(
  source: [Watchable<T1>, Watchable<T2>, Watchable<T3>, Watchable<T4>, Watchable<T5>],
  fn: WatchFn<[T1, T2, T3, T4, T5]>
): WatchStop;
export function watch<T1, T2, T3, T4, T5, T6>(
  source: [
    Watchable<T1>,
    Watchable<T2>,
    Watchable<T3>,
    Watchable<T4>,
    Watchable<T5>,
    Watchable<T6>
  ],
  fn: WatchFn<[T1, T2, T3, T4, T5, T6]>
): WatchStop;

export function watch(sourceOrSources: any = [], fn: any) {
  const isArray = Array.isArray(sourceOrSources);
  const sources: Array<Watchable<any>> = isArray ? sourceOrSources : [sourceOrSources];

  if (!sources.length) {
    throw new Error('watch needs at least one source.');
  }

  const deps: InternalWrapper[] = sources.map(source => {
    if (typeof source === 'function') {
      return computed(source) as InternalWrapper;
    }
    return source as InternalWrapper;
  });

  const needUpdate = deps.map(dep => dep.__vNeedUpdate);
  const unsub = subscribe(combineLatest(...needUpdate), () => {
    const values = deps.map(dep => dep.value);
    fn(isArray ? values : values[0]);
  });

  return () => unsub.unsubscribe();
}

export function asObservable<T>(wrapper: Wrapper<T>) {
  const val = new BehaviorSubject(wrapper.value);
  watch(wrapper, newValue => {
    val.next(newValue);
  });
  return val.asObservable();
}

export function fromObservable<T>(observable: Observable<T>, initial: T): Wrapper<T> {
  const val = value(initial);
  subscribe(observable, newValue => {
    val.value = newValue;
  });
  return computed(() => val.value);
}



export function observe<T extends object, K extends keyof T>(
  obj: T,
  fn: (props: TKeys<T>) => K
): Wrapper<T[K]> {
  const key = fn(keyof<T>());
  const val = value(obj[key]);
  Object.defineProperty(obj, key, {
    set: newValue => (val.value = newValue),
    get: () => val.value
  });
  return val;
}

const proxy = new Proxy(Object.create(null), {
  get: (_, propertyName) => propertyName
});

type TKeys<T extends object> = { [P in keyof T]: P };

function keyof<T extends object>(): TKeys<T> {
  return proxy as any;
}
