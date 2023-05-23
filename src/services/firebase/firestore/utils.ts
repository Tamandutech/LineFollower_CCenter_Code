export function objectToMap<K extends string | number | symbol, T>(
  obj: Record<K, T>
): Map<K, T> {
  const map = new Map();
  Object.entries(obj).forEach(([key, value]) => {
    if (value instanceof Object && value !== null) {
      map.set(key, objectToMap(value as Record<string, unknown>));
    } else {
      map.set(key, value);
    }
  });
  return map;
}

export function mapToObject<K extends string | number | symbol, T>(
  map: Map<K, T>
): Record<K, T> {
  const obj = {} as Record<K, T>;
  for (const [key, value] of map.entries()) {
    if (value instanceof Map) {
      obj[key] = mapToObject(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
