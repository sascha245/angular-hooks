import { InjectFlags, InjectionToken, Injector, Type } from '@angular/core';

import { getContext } from './context';

export interface Injectable {
  injector: Injector;
}

function isInjectableContext(context: any): context is Injectable {
  return context && context.injector && typeof context.injector.get === 'function';
}

export function provide<T>(
  token: Type<T> | InjectionToken<T>,
  notFoundValue?: T,
  flags?: InjectFlags
): T {
  const context = getContext();
  if (isInjectableContext(context)) {
    return context.injector.get(token, notFoundValue, flags);
  }
  throw new Error("Cannot use 'inject' in non injectable context");
}
