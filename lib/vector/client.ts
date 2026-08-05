import { Index } from "@upstash/vector";

let _index: Index | null = null;

export function vectorIndex(): Index {
  if (_index) return _index;
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) throw new Error("UPSTASH_VECTOR_REST_URL / UPSTASH_VECTOR_REST_TOKEN not set");
  _index = new Index({ url, token });
  return _index;
}
