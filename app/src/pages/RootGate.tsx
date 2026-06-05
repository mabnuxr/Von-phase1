import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RootGate() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/chat/new", { replace: true });
  }, [navigate]);

  return <div className="p-6">Redirecting...</div>;
}
