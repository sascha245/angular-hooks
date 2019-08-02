import { Subject } from 'rxjs';

import { Inject, Injector } from '@angular/core';

import { Context, getContext, withContext } from './context';
import { Injectable } from './provide';

export interface Lifecycles {
  onInit: Subject<void>;
  onAfterViewInit: Subject<void>;
  onAfterContentInit: Subject<void>;
  onDestroy: Subject<void>;
}

export interface ComponentContext extends Context, Injectable, Lifecycles {}

type LifecycleType = keyof Lifecycles;

function lifecycle(fn: () => void, lifecycleType: LifecycleType) {
  const context: any = getContext();
  const lifecycle = context[lifecycleType];
  if (lifecycle && lifecycle instanceof Subject) {
    return lifecycle.subscribe(() => fn());
  }
  throw new Error(`Cannot use '${lifecycleType}' in non component context`);
}

export const onInit = <T>(fn: () => void) => lifecycle(fn, 'onInit');
export const onAfterViewInit = <T>(fn: () => void) => lifecycle(fn, 'onAfterViewInit');
export const onAfterContentInit = <T>(fn: () => void) => lifecycle(fn, 'onAfterContentInit');
export const onDestroy = <T>(fn: () => void) => lifecycle(fn, 'onDestroy');

function createContext(injector: Injector): ComponentContext {
  return {
    injector,
    destroy$: new Subject(),
    onInit: new Subject(),
    onDestroy: new Subject(),
    onAfterViewInit: new Subject(),
    onAfterContentInit: new Subject()
  };
}

interface Hooks<T> {
  ngHooks(): T;
}

export abstract class UseHooks<C extends Hooks<any>> {
  private _context: ComponentContext = createContext(this.injector);
  constructor(@Inject(Injector) private readonly injector: Injector) {
    const context = this._context;
    if (!context) {
      throw new Error(
        'Could not setup component: Make sure your component inherits from WithHooks'
      );
    }
    this.$data = withContext(context, () => this.ngHooks());
  }
  ngOnInit(): void {
    this._context.onInit.next();
  }
  ngOnDestroy(): void {
    this._context.onDestroy.next();
  }
  ngAfterViewInit(): void {
    this._context.onAfterViewInit.next();
  }
  ngAfterContentInit(): void {
    this._context.onAfterContentInit.next();
  }

  public abstract ngHooks(): any;
  public $data: ReturnType<C['ngHooks']>;
}
