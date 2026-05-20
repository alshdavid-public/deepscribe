import { useEffect, useState } from "preact/hooks";

export function useLazyModule<T>(importFn: () => Promise<T>): T | undefined {
  const [mod, setMod] = useState<T | undefined>();

  useEffect(() => {
    importFn().then(setMod);
  }, [globalThis]);

  return mod;
}
