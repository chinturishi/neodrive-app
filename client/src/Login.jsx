import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "rishikanta.mohanty@eagleview.com",
    password: "Test@123",
  });
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      console.log(res.cookies);
      if (data.message === "Logged in successfully") {
        setMsg("Login successful!");
        navigate("/");
      } else {
        setMsg(data.message || "Login failed");
      }
    } catch (err) {
      setMsg("Network error");
    }
  };

  const msgClass = msg
    ? msg.toLowerCase().includes("success")
      ? styles.success
      : styles.error
    : "";

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.loginForm}
      autoComplete="off"
    >
      <h2 className={styles.heading}>Login</h2>
      <div className={styles.inputGroup}>
        <input
          name="email"
          type="email"
          placeholder=" "
          value={form.email}
          onChange={handleChange}
          required
          className={styles.input}
          id="login-email"
        />
        <label htmlFor="login-email" className={styles.label}>
          Email
        </label>
      </div>
      <div className={styles.inputGroup}>
        <input
          name="password"
          type="password"
          placeholder=" "
          value={form.password}
          onChange={handleChange}
          required
          className={styles.input}
          id="login-password"
        />
        <label htmlFor="login-password" className={styles.label}>
          Password
        </label>
      </div>
      <button type="submit" className={styles.button}>
        Login
      </button>
      <div className={styles.registerPrompt}>
        Don't have an account?{" "}
        <Link to="/register" className={styles.registerLink}>
          Register
        </Link>
      </div>
      {msg && <div className={`${styles.message} ${msgClass}`}>{msg}</div>}
    </form>
  );
}
