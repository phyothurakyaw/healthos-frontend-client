import React from "react";
import { Activity,LogOut } from "lucide-react";
export default function Navbar({tabs,page,setPage,T,font,setFont,lang,setLang,languages,user,api,setUser,setDemo,setSynced}) {
 return (
      <header className="border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-5 py-4 flex flex-wrap gap-4 justify-between items-center">
          <button
            type="button"
            onClick={() => setPage("dashboard")}
            className="flex items-center gap-2 text-2xl font-extrabold"
          >
            <Activity className="accent" />
            Health<span className="accent">OS</span>
          </button>

          {/* Navigation */}
          <nav className="flex flex-wrap items-center gap-1">
            {tabs.map(([key, Icon]) => (
              <button
                type="button"
                key={key}
                onClick={() => setPage(key)}
                className={
                  "navbutton flex items-center gap-2 " +
                  (page === key ? "active" : "")
                }
              >
                <Icon size={17} />
                {T(key)}
              </button>
            ))}

            {/* Font Size Controls */}
            <button
              type="button"
              className="ghost !py-2"
              onClick={() =>
                setFont((value) =>
                  Math.max(85, value - 5)
                )
              }
              aria-label="Decrease font size"
            >
              A−
            </button>

            <button
              type="button"
              className="ghost !py-2"
              onClick={() =>
                setFont((value) =>
                  Math.min(130, value + 5)
                )
              }
              aria-label="Increase font size"
            >
              A+
            </button>

            {/* Language Selector */}
            <select
              aria-label={T("language")}
              className="field !w-auto"
              value={lang}
              onChange={(event) =>
                setLang(event.target.value)
              }
            >
              {Object.entries(languages).map(
                ([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                )
              )}
            </select>
          </nav>

          {/* Logout */}
          <button
            type="button"
            className="ghost flex items-center gap-2"
            onClick={async () => {
              if (user) {
                await api("/auth/logout", {
                  method: "POST",
                }).catch(() => {});
              }

              setUser(null);
              setDemo(false);
              setSynced(false);
            }}
          >
            <LogOut size={16} />
            {T("logout")}
          </button>
        </div>
      </header>
 );
}
