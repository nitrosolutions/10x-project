import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type PlatformType = "ios" | "android" | "desktop" | "unknown";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>("unknown");

  useEffect(() => {
    // Wykryj platformę
    const detectPlatform = (): PlatformType => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile = isIOS || isAndroid;

      if (isIOS) return "ios";
      if (isAndroid) return "android";
      if (!isMobile) return "desktop";
      return "unknown";
    };

    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);

    console.log("[PWA] Detected platform:", detectedPlatform);

    // Sprawdź czy aplikacja jest już zainstalowana
    const checkIfInstalled = (): boolean => {
      // Sprawdź czy aplikacja działa w trybie standalone
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

      // Dla iOS Safari
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIOSStandalone = (window.navigator as any).standalone === true;

      const installed = isStandalone || isIOSStandalone;
      setIsInstalled(installed);

      console.log("[PWA] Is installed:", installed);
      return installed;
    };

    const installed = checkIfInstalled();

    // Nasłuchuj na event beforeinstallprompt (Desktop Chrome/Edge, Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] beforeinstallprompt event fired!");
      // Zapobiegaj domyślnemu promptowi przeglądarki
      e.preventDefault();

      // Zapisz event, aby móc wywołać go później
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Nasłuchuj na event appinstalled
    const handleAppInstalled = () => {
      console.log("[PWA] App installed!");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Dla iOS Safari i Desktop - pokazuj przycisk jeśli nie jest zainstalowana
    // Nawet jeśli beforeinstallprompt jeszcze nie został wywołany
    if (!installed) {
      if (detectedPlatform === "ios") {
        console.log("[PWA] iOS detected - showing install button");
        setIsInstallable(true);
      } else if (detectedPlatform === "desktop") {
        console.log("[PWA] Desktop detected - showing install button (waiting for beforeinstallprompt)");
        setIsInstallable(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Funkcja do wywołania promptu instalacji
  const promptInstall = async (): Promise<boolean> => {
    // Dla platform z natywnym promptem (Desktop Chrome/Edge, Android Chrome)
    if (deferredPrompt) {
      // Pokaż prompt instalacji
      await deferredPrompt.prompt();

      // Czekaj na wybór użytkownika
      const choiceResult = await deferredPrompt.userChoice;

      // Wyczyść zapisany prompt
      setDeferredPrompt(null);
      setIsInstallable(false);

      return choiceResult.outcome === "accepted";
    }

    // Dla iOS Safari - zwróć false, aby komponent mógł pokazać instrukcje
    if (platform === "ios") {
      return false;
    }

    return false;
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    platform,
    promptInstall,
    supportsNativePrompt: !!deferredPrompt,
  };
}
