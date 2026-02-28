/**
 * Switch to "auth0" when integrating Auth0 SDK/routes.
 * Local provider keeps app development unblocked.
 */
export const AUTH_PROVIDER: "local" | "auth0" =
  process.env.NEXT_PUBLIC_AUTH_PROVIDER === "auth0" ? "auth0" : "local"

