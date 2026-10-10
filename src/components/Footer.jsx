import React from "react";
export default function Footer({T}) {
 return (
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-7xl mx-auto p-7 flex flex-wrap justify-between gap-4 items-center">
          <div>
            <strong className="text-xl">
              Health
              <span className="accent">OS</span>
            </strong>

            <p className="muted text-sm mt-1">
              {T("footer")}
            </p>
          </div>

          <p className="muted text-sm">
            © {new Date().getFullYear()} HealthOS ·
            Wellness + fitness + productivity ·
            Not medical advice
          </p>
        </div>
      </footer>
 );
}
