import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../infrastructure/api/client";
import { login } from "../authService";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import styles from "./LoginForm.module.css";

interface Fields {
  username: string;
  password: string;
}

const INITIAL: Fields = { username: "", password: "" };

export function LoginForm() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function setField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  const isEmpty = !fields.username.trim() || !fields.password;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEmpty) return;

    setLoading(true);
    setError(null);

    try {
      await login(fields.username.trim(), fields.password);
      navigate("/app/inbox");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Incorrect username or password.");
        } else {
          setError(err.detail || "Login failed. Please try again.");
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Something went wrong: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <div className={styles.alert} role="alert">
          <AlertIcon />
          <span>{error}</span>
        </div>
      )}

      <Input
        id="username"
        label="Username"
        type="text"
        placeholder="your_username"
        autoComplete="username"
        required
        value={fields.username}
        onChange={(e) => setField("username", e.target.value)}
        disabled={loading}
      />

      <div className={styles.passwordField}>
        <label className={styles.passwordLabel} htmlFor="password">
          Password
        </label>
        <div className={styles.passwordInputWrap}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className={styles.passwordInput}
            placeholder="Your password"
            autoComplete="current-password"
            required
            value={fields.password}
            onChange={(e) => setField("password", e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className={styles.visibilityBtn}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={loading}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        loading={loading}
        loadingLabel="loading"
        disabled={isEmpty}
        style={{ marginTop: "var(--space-2)" }}
      >
        Sign in
      </Button>
    </form>
  );
}

function AlertIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path
        d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z"
        fill="currentColor"
      />
      <path
        d="M7.25 4.75h1.5v4h-1.5v-4Zm0 5.5h1.5v1.5h-1.5v-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.77 21.77 0 0 1-4.12 5.29" />
      <path d="M6.61 6.61A21.77 21.77 0 0 0 1 12s4 7 11 7a10.94 10.94 0 0 0 4.91-1.17" />
    </svg>
  );
}
