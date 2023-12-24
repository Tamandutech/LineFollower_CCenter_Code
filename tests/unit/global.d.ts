type MockType<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]: T[P] extends (...args: any[]) => Promise<any> | any
    ? import('vitest').Mock<Parameters<T[P]>, ReturnType<T[P]>>
    : T[P];
};
