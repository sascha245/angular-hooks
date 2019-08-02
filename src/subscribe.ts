import { Observable, PartialObserver, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { getContext } from './context';

export function subscribe<T>(
  observable: Observable<T>,
  observer?: PartialObserver<T>
): Subscription;
export function subscribe<T>(
  observable: Observable<T>,
  next?: (value: T) => void,
  error?: (error: any) => void,
  complete?: () => void
): Subscription;
export function subscribe<T>(
  observable: Observable<T>,
  oberserverOrFn?: any,
  fnError?: any,
  fnComplete?: any
) {
  const context = getContext();
  return observable
    .pipe(takeUntil(context.destroy$))
    .subscribe(oberserverOrFn, fnError, fnComplete);
}
