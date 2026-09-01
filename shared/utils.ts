
export type Brand<K, T> = K & { readonly __brand: T };

export type UriString = Brand<string, "uri">;

export function makeUriString(id: string): UriString {
  return id as UriString;
}