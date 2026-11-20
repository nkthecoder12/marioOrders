import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function CustomerLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-juice-cream">
      <div className="pb-24">
        <Outlet />
      </div>
      <nav className="tab-safe fixed bottom-0 left-0 right-0 z-40 border-t border-orange-100 bg-white/95 shadow-bar backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center text-xs font-semibold ${isActive ? "text-orange-600" : "text-stone-500"}`
            }
          >
            <span className="text-lg">🥤</span>
            Menu
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center text-xs font-semibold ${isActive ? "text-orange-600" : "text-stone-500"}`
            }
          >
            <span className="text-lg">🧾</span>
            Orders
          </NavLink>
          <button
            type="button"
            className="flex min-h-14 flex-col items-center justify-center text-xs font-semibold text-stone-500"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
