export type ProtectedCollectionState =
  "loading" | "empty" | "unavailable" | "denied";

export function resolveProtectedCollectionState(input: {
  authorized: boolean;
  complete: boolean;
  failed?: boolean;
}): ProtectedCollectionState {
  if (!input.authorized) return "denied";
  if (input.failed) return "unavailable";
  if (!input.complete) return "loading";
  return "empty";
}

export class ContextRequestGuard {
  #version = 0;
  #controller: AbortController | null = null;

  beginContextChange() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const version = ++this.#version;
    return {
      signal: this.#controller.signal,
      isCurrent: () =>
        version === this.#version && !this.#controller?.signal.aborted,
    };
  }

  clear() {
    this.#controller?.abort();
    this.#controller = null;
    this.#version += 1;
  }
}
