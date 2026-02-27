// types/react-app-env.d.ts
// 'export {}' makes this a module file so the declare block below
// augments React's types instead of replacing them entirely.
export {};

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Extending HTMLAttributes to include non-standard attributes for input
    webkitdirectory?: string;
    directory?: boolean;
  }
}
