declare namespace App {
  interface Locals {
    /** Signed-in CMS user, set by src/middleware.ts on /admin routes */
    user?: { email: string };
  }
}
