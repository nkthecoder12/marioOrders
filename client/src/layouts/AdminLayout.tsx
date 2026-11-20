import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/admin", label: "Queue", emoji: "🛎️", end: true },
  { to: "/admin/menu", label: "Menu", emoji: "🥭", end: false },
  { to: "/admin/dashboard", label: "Dashboard", emoji: "📊", end: false },
];

export function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-juice-cream lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-orange-100 bg-white p-4 lg:flex">
        <div className="px-2 pb-6">
          <div className="text-2xl">🍊</div>
          <h1 className="text-lg font-bold">Mario Juice</h1>
          <p className="text-xs text-stone-500">{user?.name} · owner</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-2 rounded-2xl px-3 text-sm font-semibold ${
                  isActive ? "bg-orange-500 text-white" : "text-stone-600 hover:bg-orange-50"
                }`
              }
            >
              <span>{l.emoji}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="mt-4 min-h-11 rounded-2xl px-3 text-left text-sm font-semibold text-stone-500 hover:bg-stone-100"
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          Logout
        </button>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <Outlet />
      </div>

      <nav className="tab-safe fixed bottom-0 left-0 right-0 z-40 border-t border-orange-100 bg-white/95 shadow-bar backdrop-blur lg:hidden">
        <div className="grid grid-cols-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center text-[11px] font-semibold ${
                  isActive ? "text-orange-600" : "text-stone-500"
                }`
              }
            >
              <span className="text-lg">{l.emoji}</span>
              {l.label}
            </NavLink>
          ))}
          <button
            type="button"
            className="flex min-h-14 flex-col items-center justify-center text-[11px] font-semibold text-stone-500"
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
