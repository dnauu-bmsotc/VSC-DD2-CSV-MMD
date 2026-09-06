
export type Brand<K, T> = K & { readonly __brand: T };

export type UriString = Brand<string, "uri">;

export function makeUriString(id: string): UriString {
  return id as UriString;
}

export class UriStringPool {
	private static cache = new Map<UriString, UriStringRef>();
	public static get(uri: UriString): UriStringRef {
		let ref = this.cache.get(uri);
		if (!ref) {
			ref = new UriStringRef(uri);
			this.cache.set(uri, ref);
		}
		return ref;
	}
	public static getCacheSize() {
		return this.cache.size;
	}
}

export class UriStringRef {
	constructor(
		public readonly value: UriString
	) {}
}

export function mapGetOrSet<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
	if (map.has(key)) {
		return map.get(key) as V;
	}
	map.set(key, defaultValue);
	return defaultValue;
}

export function countEnum(enumObj: any): number {
	return Object.keys(enumObj).filter(key => isNaN(Number(key))).length;	
}