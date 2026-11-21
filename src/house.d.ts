// The parts of the house's shared scripts (adervec.github.io/font.js, cowork.js) this app uses.
export {};

declare global {
  interface Window {
    appFont?: {
      google: {
        token(opts?: { silent?: boolean }): Promise<string>;
        signedIn(): boolean;
        signOut(): void;
        read(name: string): Promise<string | null>;
        write(name: string, text: string): Promise<void>;
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
