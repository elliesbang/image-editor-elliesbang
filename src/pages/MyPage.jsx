import { useEffect, useMemo, useState } from "react";
import AdminMyPage from "./Admin/MyPage.jsx";
import StudentMyPage from "./Student/MyPage.jsx";
import VodMyPage from "./Vod/MyPage.jsx";

const ROLE_COMPONENTS = {
  admin: AdminMyPage,
  student: StudentMyPage,
  vod: VodMyPage,
};

function normalizeRole(value) {
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  if (["admin", "student", "vod"].includes(normalized)) {
    return normalized;
  }
  return null;
}

export default function MyPage() {
  const [storedUser, setStoredUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    let parsed = null;
    if (rawUser) {
      try {
        parsed = JSON.parse(rawUser);
      } catch (error) {
        console.error("Failed to parse stored user", error);
      }
    }

    const candidateRole =
      normalizeRole(parsed?.role) ||
      normalizeRole(parsed?.user?.role) ||
      normalizeRole(parsed?.user?.properties?.Role) ||
      normalizeRole(parsed?.user?.properties?.role);

    const fallbackRole = normalizeRole(localStorage.getItem("role"));

    setStoredUser(parsed?.user ?? parsed ?? null);
    setRole(candidateRole || fallbackRole);
  }, []);

  const effectiveRole = useMemo(() => {
    return role || normalizeRole(storedUser?.role) || normalizeRole(storedUser?.properties?.Role);
  }, [role, storedUser]);

  const Component = effectiveRole ? ROLE_COMPONENTS[effectiveRole] ?? StudentMyPage : null;

  if (!Component) {
    return (
      <div className="mypage-loading">
        <p>사용자 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  return <Component user={storedUser} />;
}
