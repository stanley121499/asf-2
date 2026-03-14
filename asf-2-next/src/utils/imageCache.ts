/**
 * Module-level cache of image URLs that have been fully loaded by the browser.
 *
 * This Set lives entirely outside of React's component lifecycle. It persists
 * across any number of component mounts, unmounts, and re-renders for the
 * entire browser session. This means a `SmartImage` that has already loaded
 * its URL will skip the skeleton and display instantly on any subsequent
 * mount — including when the user scrolls back up the page.
 *
 * The cache is intentionally not stored in React state or context so that
 * reading from it never triggers a re-render.
 */
export const imageCache = new Set<string>();
