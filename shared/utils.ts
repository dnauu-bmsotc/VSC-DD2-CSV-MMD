import * as path from 'node:path';

export type Brand<K, T> = K & { readonly __brand: T };

export type UriString = Brand<string, "uri">;
export type PathString = Brand<string, "resolvedPath">;

export function makeUriString(s: string): UriString {
	return (isCaseInsensitive() ? s.toLowerCase() : s) as UriString;
}

export function makePathString(p: string): PathString {
	const resolved = path.resolve(p);
	return (isCaseInsensitive() ? resolved.toLowerCase() : resolved) as PathString;
}

export function mapGetOrSet<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
	if (map.has(key)) {
		return map.get(key) as V;
	}
	map.set(key, defaultValue);
	return defaultValue;
}

function isCaseInsensitive() {
  	return process.platform === 'win32' || process.platform === 'darwin';
}

export const listHasDuplicates = (arr: any[]) => new Set(arr).size !== arr.length;
