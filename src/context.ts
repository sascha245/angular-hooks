import { Subject } from "rxjs";

const stack: Context[] = [];
const global: Context = {
  destroy$: new Subject()
};

export interface Context {
  destroy$: Subject<void>;
}

export function useContext(context: any) {
  stack.push(context);
}
export function closeContext() {
  stack.pop();
}

export function getContext() {
  return (stack.length > 0 && stack[stack.length - 1]) || global;
}

export function withContext<T>(context: Context, fn: () => T) {
  useContext(context);
  const data = fn();
  closeContext();
  return data;
}
