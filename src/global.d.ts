/// <reference lib="webworker" />

declare global {
  // Cloudflare Workers R2 Bucket
  interface R2Bucket {
    put(key: string, value: ArrayBuffer | ReadableStream | Uint8Array, options?: { httpMetadata?: { contentType: string } }): Promise<R2Object>
    get(key: string): Promise<R2Object | null>
    delete(key: string | string[]): Promise<void>
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects>
  }

  interface R2Object {
    key: string
    size: number
    httpMetadata: { contentType: string }
    writeHttpMetadata(headers: Headers): void
    arrayBuffer(): Promise<ArrayBuffer>
    text(): Promise<string>
    json(): Promise<unknown>
  }

  interface R2Objects {
    objects: R2Object[]
    truncated: boolean
    cursor?: string
  }

  // Buffer is available in Cloudflare Workers runtime
  const Buffer: {
    from(data: string, encoding: string): Buffer
    from(data: Uint8Array): Buffer
    from(data: ArrayBuffer): Buffer
    isBuffer(obj: unknown): obj is Buffer
  }

  interface Buffer {
    byteLength: number
    toString(encoding: string): string
  }

  // crypto.randomUUID is available in Cloudflare Workers
  interface Crypto {
    randomUUID(): string
  }
}

export {}
