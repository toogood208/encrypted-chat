import { Link } from "react-router-dom";
import { LoginForm } from "../components/LoginForm";
import styles from "./AuthPage.module.css";

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <p className={styles.brandName}>WhisperBox</p>
        <span className={styles.brandTagline}>Sign in to your secure account</span>
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>Welcome back! Please sign in to continue.</p>
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


