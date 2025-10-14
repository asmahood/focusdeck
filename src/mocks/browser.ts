/**
 * MSW Browser Configuration
 *
 * This sets up a mock service worker for the browser environment.
 * Use this for Storybook or development mode API mocking.
 *
 * Note: This requires a service worker file to be present in your public directory.
 * To generate it, run: npx msw init public/ --save
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Setup request interception for browser environment.
 * Start the worker with: worker.start()
 */
export const worker = setupWorker(...handlers);
