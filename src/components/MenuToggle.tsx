import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react";

interface MenuToggleProps {
  userEmail?: string;
}

export default function MenuToggle({ userEmail }: MenuToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "/login";
      } else {
        alert("Nie udało się wylogować. Spróbuj ponownie.");
      }
    } catch {
      alert("Wystąpił błąd podczas wylogowania.");
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <User size={24} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg py-1 z-50">
          {userEmail && (
            <div className="px-4 py-2 text-sm text-muted-foreground border-b">
              <div className="font-medium text-foreground">{userEmail}</div>
            </div>
          )}
          <a href="/account" className="block px-4 py-2 text-sm hover:bg-accent transition-colors">
            Konto
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Wyloguj
          </button>
        </div>
      )}
    </div>
  );
}
