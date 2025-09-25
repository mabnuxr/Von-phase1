import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../lib/auth";
const VonlabsImage = "/images/vonlabs.png";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = getAccessToken();
    if (!token) {
      if (import.meta.env.DEV) {
        console.log("[Dashboard] No token found, redirecting to login");
      }
      navigate("/", { replace: true });
      return;
    }
    if (import.meta.env.DEV) {
      console.log("[Dashboard] Token found, user authenticated");
    }
  }, [navigate]);

  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 30px",
      backgroundColor: "#f5f7fa",
      boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
      borderRadius: "8px",
      margin: "20px auto",
      maxWidth: "800px",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    image: {
      width: "40px",
      height: "40px",
      borderRadius: "5px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#333",
    },
    button: {
      padding: "10px 20px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "16px",
      transition: "background-color 0.3s ease",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.logo}>
        <img src={VonlabsImage} alt="Vonlabs Logo" style={styles.image} />
        <span style={styles.title}>Dashboard</span>
      </div>
      <button
        style={styles.button}
        onClick={() => navigate("/logout")}
        onMouseOver={(e) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = "#0056b3")
        }
        onMouseOut={(e) =>
          ((e.target as HTMLButtonElement).style.backgroundColor = "#007bff")
        }
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
