"use client";

type TopNavProps = {
  userName: string | null;
  userRole: string | null;
  onLogout: () => void;
};

export default function TopNav({ userName, userRole, onLogout }: TopNavProps) {
  return (
    <header className="w-full h-14 border-b bg-white flex items-center justify-end px-6">
      <div className="flex items-center gap-3 text-sm">
        {userName && (
          <div className="text-slate-700">
            {userName}{" "}
            {userRole && <span className="text-slate-400">({userRole})</span>}
          </div>
        )}
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded-md border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
