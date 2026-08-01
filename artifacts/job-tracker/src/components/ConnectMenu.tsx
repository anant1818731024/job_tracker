import { useState, useRef, useEffect } from "react";
import { Sparkles, Mail, MessageCircle } from "lucide-react";

const EMAIL = "avashishtha2000@gmail.com";
const WHATSAPP_NUMBER = "919870862593";

export default function ConnectMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-white pl-3 pr-3.5 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-sm transition whitespace-nowrap"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="sm:hidden">Hire me</span>
        <span className="hidden sm:inline lg:hidden">Full-Stack &amp; AI Work</span>
        <span className="hidden lg:inline">Available for Full-Stack &amp; AI Work</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
          <p className="text-sm font-semibold text-gray-900">Open for full-stack & AI work</p>
          <p className="text-xs text-gray-500 mt-1 mb-3">
            Reach out for freelance, contract, or full-time opportunities.
          </p>
          <div className="space-y-1.5">
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">{EMAIL}</span>
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>+91 98708 62593</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
