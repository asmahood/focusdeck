/**
 * MSW Server Configuration for Node.js (Jest Tests)
 *
 * This sets up a mock service worker server that intercepts HTTP requests
 * during testing. It's configured to run in Node.js environment for Jest tests.
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Setup request interception server with default handlers.
 * Additional handlers can be added per-test using server.use()
 */
export const server = setupServer(...handlers);
