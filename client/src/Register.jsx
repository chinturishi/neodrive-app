import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "Rishikanta Mohanty",
    email: "rishikanta.mohanty@eagleview.com",
    password: "Test@123",
  });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const url = "http://localhost:5000";

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${url}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      console.log(data);
      console.log(res.status);
      if (res.status !== 409) {
        setMsg("User registered successfully");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setMsg(data.message || "Error");
      }
    } catch (err) {
      console.log(err);
      setMsg("Network error");
    }
  };

  const msgClass = msg
    ? msg.toLowerCase().includes("error") ||
      msg.toLowerCase().includes("network") ||
      msg.toLowerCase().includes("exists")
      ? styles.error
      : styles.success
    : "";

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.registerForm}
      autoComplete="off"
    >
      <h2 className={styles.heading}>User Registration</h2>
      <div className={styles.inputGroup}>
        <input
          name="name"
          placeholder=" "
          value={form.name}
          onChange={handleChange}
          required
          autoFocus
          className={styles.input}
          id="register-name"
        />
        <label htmlFor="register-name" className={styles.label}>
          Name
        </label>
      </div>
      <div className={styles.inputGroup}>
        <input
          name="email"
          type="email"
          placeholder=" "
          value={form.email}
          onChange={handleChange}
          required
          className={styles.input}
          id="register-email"
        />
        <label htmlFor="register-email" className={styles.label}>
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
          id="register-password"
        />
        <label htmlFor="register-password" className={styles.label}>
          Password
        </label>
      </div>
      <button type="submit" className={styles.button}>
        Register
      </button>
      {msg && <div className={`${styles.message} ${msgClass}`}>{msg}</div>}
    </form>
  );
}
