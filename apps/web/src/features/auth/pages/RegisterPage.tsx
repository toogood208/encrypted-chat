import { Link } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";
import styles from "./AuthPage.module.css";

export function RegisterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.brand}>
        <p className={styles.brandName}>WhisperBox</p>
        <span className={styles.brandTagline}>Create your secure account</span>
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join WhisperBox to chat securely and privately with friends and colleagues.</p>
        <RegisterForm />
        <p className={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

