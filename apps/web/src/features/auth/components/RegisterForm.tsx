import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../../infrastructure/api/client";
import { register } from "../authService";
import { Input } from "../../../shared/components/ui/Input";
import { Button } from "../../../shared/components/ui/Button";
import styles from "./RegisterForm.module.css";

interface Fields {
  username: string;
  display_name: string;
  password: string;
  confirmPassword: string;
}

const INITIAL: Fields = {
  username: "",
  display_name: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");

  function setField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  const passwordMismatch =
    fields.confirmPassword.length > 0 &&
    fields.password !== fields.confirmPassword;

  const isEmpty =
    !fields.display_name.trim() ||
    !fields.username.trim() ||
    !fields.password ||
    !fields.confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordMismatch) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setLoadingStage("Generating encryption keys…");

    try {
      await register(
        fields.username.trim(),
        fields.display_name.trim(),
        fields.password,
      );
      navigate("/app/inbox");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("That username is already taken. Please choose another.");
        } else {
          setError(err.detail || "Registration failed. Please try again.");
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Something went wrong: ${msg}`);
      }
    } finally {
      setLoading(false);
      setLoadingStage("");
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
        id="display_name"
        label="Display name"
        type="text"
        placeholder="O.S"
        autoComplete="name"
        required
        maxLength={64}
        value={fields.display_name}
        onChange={(e) => setField("display_name", e.target.value)}
        disabled={loading}
      />

      <Input
        id="username"
        label="Username"
        type="text"
        placeholder="O.S_123"
        autoComplete="username"
        required
        minLength={3}
        maxLength={32}
        pattern="[a-zA-Z0-9_\-]+"
        value={fields.username}
        onChange={(e) => setField("username", e.target.value)}
        disabled={loading}
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={128}
        value={fields.password}
        onChange={(e) => setField("password", e.target.value)}
        disabled={loading}
      />

      <Input
        id="confirmPassword"
        label="Confirm password"
        type="password"
        placeholder="Repeat your password"
        autoComplete="new-password"
        required
        value={fields.confirmPassword}
        onChange={(e) => setField("confirmPassword", e.target.value)}
        disabled={loading}
        error={passwordMismatch ? "Passwords do not match" : undefined}
      />

      <Button
        type="submit"
        fullWidth
        loading={loading}
        loadingLabel={loadingStage}
        disabled={isEmpty || passwordMismatch}
        style={{ marginTop: "var(--space-2)" }}
      >
        Create account
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

