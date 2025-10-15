import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Sprawdź czy aplikacja jest już zainstalowana
    const checkIfInstalled = () => {
      // Sprawdź czy aplikacja działa w trybie standalone
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

      // Dla iOS Safari
      const isIOSStandalone = (window.navigator as any).standalone === true;

      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();

    // Nasłuchuj na event beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Zapobiegaj domyślnemu promptowi przeglądarki
      e.preventDefault();

      // Zapisz event, aby móc wywołać go później
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Nasłuchuj na event appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Funkcja do wywołania promptu instalacji
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    // Pokaż prompt instalacji
    await deferredPrompt.prompt();

    // Czekaj na wybór użytkownika
    const choiceResult = await deferredPrompt.userChoice;

    // Wyczyść zapisany prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    return choiceResult.outcome === "accepted";
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
