// The parts of the house's shared scripts (adervec.github.io/font.js, cowork.js) this app uses.
export {};

declare global {
  interface Window {
    appFont?: {
      cloud: {
        signIn(opts?: { silent?: boolean }): Promise<unknown>;
        signedIn(): boolean;
        signOut(): void;
        syncDoc(name: string, h: { load(): unknown; save(doc: unknown): void; merge(local: unknown, remote: unknown): unknown }): Promise<{ pulled: boolean; pushed: boolean }>;
      };
      getAccount(): { name: string; email: string; picture: string } | null;
      logSession(s: { kind: string; minutes?: number; id?: string }): boolean;
      parseJSON(text: string, maxBytes?: number): unknown;
    };
    cowork?: { mount(host: HTMLElement, cfg: unknown): unknown };
  }
}

// font.js's custom elements, so they can be written as JSX
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "app-account": object;
      "app-theme-picker": object;
      "app-font-picker": object;
    }
  }
}
