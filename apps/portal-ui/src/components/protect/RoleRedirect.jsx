// src/components/RoleRedirect.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../session/store";
import  homePathOf  from "../../utils/roleHome";

export default function RoleRedirect() {
  const { role } = useAuthStore();
  return <Navigate to={homePathOf(role)} replace />;
}
