
export type Brand<K, T> = K & { readonly __brand: T };

export type UriString = Brand<string, "uri">;

export function makeUriString(id: string): UriString {
  return id as UriString;
}

export function mapGetOrSet<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
	if (map.has(key)) {
		return map.get(key) as V;
	}
	map.set(key, defaultValue);
	return defaultValue;
}