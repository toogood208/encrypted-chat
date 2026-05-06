import { Link } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import styles from "./AuthPage.module.css";

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <LockIcon />
          </div>
          <p className={styles.brandName}>WhisperBox</p>
        </div> */}

        <h1 className={styles.title}>Sign in</h1>

        <LoginForm />

        <p className={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link to="/register" className={styles.footerLink}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 5a3 3 0 1 1 6 0v3H9V7Zm3 6a1.5 1.5 0 0 1 .75 2.8V17h-1.5v-1.2A1.5 1.5 0 0 1 12 13Z"
        fill="white"
      />
    </svg>
  );
}
