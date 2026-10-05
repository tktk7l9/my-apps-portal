/** Builds a record from the fulfilled [key, value] results of Promise.allSettled, dropping rejections. */
export function fulfilledEntries<V>(
  results: PromiseSettledResult<[string, V]>[]
): Record<string, V> {
  return Object.fromEntries(
    results
      .filter((r): r is PromiseFulfilledResult<[string, V]> => r.status === "fulfilled")
      .map((r) => r.value)
  );
}
