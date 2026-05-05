import { type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  loading = false,
  loadingLabel = "Loading…",
  variant = "primary",
  fullWidth = false,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const classes = [
    styles.btn,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span className={styles.loadingLabel}>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
