export interface Wrapper<T> {
  value: T;
}
export type Unwrap<T> = T extends Wrapper<infer U>
  ? U
  : T extends object
  ? { [P in keyof T]: Unwrap<T[P]> }
  : T;
