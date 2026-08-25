import { lazy, Suspense, type ComponentType, type JSX } from "react";

// 和 Vue 一样，只需要传 import() 函数
export function lazyLoad<T extends object = object>(
  importFn: () => Promise<{ default: ComponentType<T> }>
): ComponentType<T> {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: T): JSX.Element {
    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}
