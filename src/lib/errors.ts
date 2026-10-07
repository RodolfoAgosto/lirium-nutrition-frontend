import { ApiError } from "./api";
import { auth } from "./auth";

// Turns any thrown value into a message for the UI. An expired or revoked
// session (401) clears the tokens so the layout sends the user to the login.
export function describeError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) {
      auth.clear();
      if (typeof window !== "undefined") window.location.replace("/login");
    }
    if (e.status === 403) return "Your role does not allow this action.";
    return e.message;
  }
  return "Something went wrong. Please try again.";
}
