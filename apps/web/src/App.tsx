import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./app/router/ProtectedRoute";
import { RegisterPage } from "./features/auth/pages/RegisterPage";
import { InboxPage } from "./features/chat/pages/InboxPage";
import { ChatPage } from "./features/chat/pages/ChatPage";
import { LoginPage } from "./features/auth/pages/LoginPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app/inbox" element={<InboxPage />} />
        <Route path="/app/chat/:userId" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
