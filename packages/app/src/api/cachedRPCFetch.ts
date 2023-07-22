import { TTLCache } from "@brokerloop/ttlcache";

const cache = new TTLCache<string, Response>({
  ttl: 3000,
  max: 10,
  clock: Date,
});

const CACHEABLE_RPC_METHODS = [
  "getBalance",
  "getAccountInfo",
  "getEpochInfo",
  "getTokenAccountBalance",
  "getTokenSupply",
];

const cacheableRequest = (options: RequestInit): boolean => {
  const parsedBody = JSON.parse(options.body as string);
  return CACHEABLE_RPC_METHODS.includes(parsedBody.method);
};

const requestToKey = (url: RequestInfo | URL, options: RequestInit): string => {
  const parsedBody = JSON.parse(options.body as string);
  delete parsedBody.id;
  return `${JSON.stringify(url)}${JSON.stringify(parsedBody)}`;
};

export const cachedRPCFetch: typeof fetch = async (url, options) => {
  if (options && cacheableRequest(options)) {
    const cacheKey = requestToKey(url, options);
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      console.log("cache hit");
      return cachedResponse;
    } else {
      console.log("cache miss - key: ", cacheKey);
    }
  }
  const response = await fetch(url, options);
  if (response.ok && options && cacheableRequest(options)) {
    const cacheKey = requestToKey(url, options);
    cache.set(cacheKey, response.clone());
  }
  return response;
};
