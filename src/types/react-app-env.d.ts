// types/react-app-env.d.ts (You can create this file or add to an existing declaration file)

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Extending HTMLAttributes to include non-standard attributes for input
    webkitdirectory?: string;
    directory?: boolean;
  }
}
