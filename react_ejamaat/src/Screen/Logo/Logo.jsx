import React from "react";
import { useNavigate } from "react-router-dom";

export default function Logo() {
  const navigate = useNavigate();

  const handleNavigate = async (route) => {
    if (route === "logout") {
      await window.ipcRenderer?.invoke("clear-token");
      navigate("/");
    } else {
      navigate(`/${route}`);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <img
        onClick={() => handleNavigate("dashboard")}
        src="https://www.seyyidmadaniullal.com/images/logo.png"
        alt="Logo"
        className="h-12 w-12 w-auto"
      />
    </div>
  );
}
