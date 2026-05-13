import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Si no hay usuario → mandar a login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere rol específico y no coincide
  if (roleRequired && user.rol !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;