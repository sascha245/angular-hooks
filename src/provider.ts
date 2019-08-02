import { Subject } from 'rxjs';

import { FactoryProvider, InjectionToken, Injector, Type } from '@angular/core';

import { closeContext, Context, useContext } from './context';
import { Injectable } from './provide';

export interface ProviderOptions<T> {
  description: string;
  provideIn?: Type<any> | 'root';
  setup: () => T;
}

export interface ProviderContext extends Context, Injectable {}

function withHooks<T>(injector: Injector, fn: () => T): T {
  const context: ProviderContext = {
    injector,
    destroy$: new Subject()
  };
  useContext(context);
  const data = fn();
  closeContext();
  return data;
}

export function createProvider<T>(options: ProviderOptions<T>) {
  const factory = (injector: Injector) => withHooks(injector, options.setup);
  const token = new InjectionToken(options.description, {
    providedIn: options.provideIn,
    factory: options.setup
  });
  const provider: FactoryProvider = {
    provide: token,
    useFactory: factory,
    deps: [Injector]
  };
  return {
    provider,
    token
  };
}
