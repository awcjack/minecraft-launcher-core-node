export interface AbortSignal {
  readonly aborted: boolean
  addEventListener(event: string, handler: () => void): this
}

export function resolveAbortSignal(signal?: AbortSignal) {
  if (signal) return signal;
  return {
    aborted: false,
    addEventListener() { return this }
  }
}
