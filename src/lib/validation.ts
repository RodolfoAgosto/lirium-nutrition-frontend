// Client-side checks mirror the backend rules (UserCreateRequestDTO / LoginRequestDTO).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  email: (v: string) => (!v.trim() ? "Email is required" : EMAIL_RE.test(v) ? "" : "Invalid email format"),
  password: (v: string) =>
    !v ? "Password is required" : v.length < 8 ? "Password must have at least 8 characters" : v.length > 100 ? "Password is too long" : "",
  required: (label: string) => (v: string) => (v.trim() ? "" : `${label} is required`),
};
