import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";

const InactivityCounter = () => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = useAuthStore.getState().getSecondsLeft();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (timeLeft === null || timeLeft <= 0 || timeLeft > 10) return null;

  return (
    <div style={{ color: "red", padding: "10px" }}>
      ⚠️ Sesión se cierra en: <strong>{timeLeft} seg</strong>
    </div>
  );
};

export default InactivityCounter;
