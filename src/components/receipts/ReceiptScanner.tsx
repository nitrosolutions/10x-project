import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { IOSInstallInstructions } from "@/components/pwa/IOSInstallInstructions";

interface ReceiptScannerProps {
  hasCamera: boolean;
}

export default function ReceiptScanner({ hasCamera }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState("");
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { isInstallable, promptInstall, platform, supportsNativePrompt } = usePWAInstall();

  // Obsługa instalacji PWA
  const handleInstallPWA = async () => {
    // eslint-disable-next-line no-console
    console.log("[PWA] Install button clicked. Platform:", platform, "Supports native:", supportsNativePrompt);

    // Dla iOS Safari - pokaż instrukcje
    if (platform === "ios" && !supportsNativePrompt) {
      setShowIOSInstructions(true);
      return;
    }

    // Dla Desktop/Android - sprawdź czy beforeinstallprompt został wywołany
    if (!supportsNativePrompt) {
      toast.error("Nie można zainstalować aplikacji", {
        description:
          "Aplikacja może być już zainstalowana lub przeglądarka nie wspiera instalacji PWA. Sprawdź czy używasz Chrome/Edge.",
      });
      return;
    }

    // Dla platform z natywnym promptem (Desktop Chrome/Edge, Android Chrome)
    const installed = await promptInstall();
    if (installed) {
      toast.success("Aplikacja zainstalowana!", {
        description: "PortfelIO została dodana do ekranu głównego",
      });
    } else {
      toast.info("Instalacja anulowana", {
        description: "Możesz zainstalować aplikację później",
      });
    }
  };

  // Obsługa wyboru pliku (aparat lub galeria)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Walidacja typu pliku
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Niewspierany format pliku", {
        description: "Tylko pliki JPEG i PNG są obsługiwane",
      });
      return;
    }

    // Rozpocznij skanowanie
    setIsScanning(true);
    setProgress("Wysyłam obraz do analizy...");

    try {
      // Timeout dla zapytania (90s - dłuższe dla dużych plików)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      let scannedData;

      try {
        // FormData z oryginalnym plikiem (bez kompresji)
        const formData = new FormData();
        formData.append("file", file);

        // Wysłanie zapytania do API
        const response = await fetch("/api/receipts/scan", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          // Specjalna obsługa błędów autoryzacji - natychmiastowe przekierowanie
          if (response.status === 401 || response.status === 403) {
            toast.error("Sesja wygasła", {
              description: "Zaloguj się ponownie, aby kontynuować",
            });
            setIsScanning(false);
            setProgress("");
            // Przekieruj do logowania po 1 sekundzie
            setTimeout(() => {
              window.location.href = "/login";
            }, 1000);
            return;
          }

          let errorMessage = "Nie udało się przetworzyć paragonu";

          try {
            // Sprawdź Content-Type przed parsowaniem JSON
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.details?.[0] || errorData.error || errorMessage;
            } else {
              // Odpowiedź nie jest JSON - prawdopodobnie błąd serwera/proxy
              const textBody = await response.text();
              // eslint-disable-next-line no-console
              console.error("[ReceiptScanner] Non-JSON error response:", {
                status: response.status,
                contentType,
                body: textBody.substring(0, 200),
              });

              // Dopasuj komunikat błędu do statusu HTTP
              if (response.status === 500) {
                errorMessage = "Błąd serwera. Spróbuj ponownie za chwilę.";
              } else if (response.status === 502 || response.status === 503 || response.status === 504) {
                errorMessage = "Serwer jest chwilowo niedostępny. Sprawdź połączenie i spróbuj ponownie.";
              } else {
                errorMessage = `Błąd serwera (${response.status}). Spróbuj ponownie.`;
              }
            }
          } catch (parseError) {
            // eslint-disable-next-line no-console
            console.error("[ReceiptScanner] Error parsing error response:", parseError);
            // Użyj domyślnego komunikatu błędu
          }

          throw new Error(errorMessage);
        }

        // Sprawdź Content-Type dla udanej odpowiedzi
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          // eslint-disable-next-line no-console
          console.error("[ReceiptScanner] Success response is not JSON:", contentType);
          throw new Error("Otrzymano nieprawidłową odpowiedź z serwera. Spróbuj ponownie.");
        }

        scannedData = await response.json();
      } catch (fetchError) {
        clearTimeout(timeout);

        // Obsługa błędów fetch i timeout
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            throw new Error("Skanowanie trwało zbyt długo. Sprawdź połączenie internetowe i spróbuj ponownie.");
          }
          // Jeśli to już jest nasz sformatowany błąd, rzuć go dalej
          if (
            fetchError.message.startsWith("Nie udało się") ||
            fetchError.message.includes("Błąd serwera") ||
            fetchError.message.includes("Otrzymano nieprawidłową")
          ) {
            throw fetchError;
          }
        }

        // Błąd sieciowy lub inny nieoczekiwany błąd
        // eslint-disable-next-line no-console
        console.error("[ReceiptScanner] Unexpected fetch error:", {
          error: fetchError,
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          name: fetchError instanceof Error ? fetchError.name : "Unknown",
          stack: fetchError instanceof Error ? fetchError.stack : undefined,
        });
        throw new Error("Nie można połączyć się z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.");
      }

      setProgress("Przekierowuję do edycji...");

      // Przekierowanie do strony edycji z rozpoznanymi danymi
      // Dane przekazujemy przez sessionStorage, aby były dostępne na następnej stronie
      // Dodajemy flagę source: 'scan' do zapisania w bazie danych
      sessionStorage.setItem(
        "scannedReceipt",
        JSON.stringify({
          ...scannedData,
          source: "scan",
        })
      );
      window.location.href = "/receipts/new?mode=scan";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Receipt scanning error:", error);

      toast.error("Błąd skanowania", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie lub dodaj paragon ręcznie",
      });

      setIsScanning(false);
      setProgress("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Loader podczas skanowania */}
      {isScanning ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">{progress}</p>
          <p className="text-sm text-muted-foreground">Proszę czekać, to może potrwać do minuty...</p>

          {/* Przycisk instalacji PWA - widoczny tylko podczas skanowania */}
          {isInstallable && (
            <div className="w-full max-w-md px-4 mt-6">
              <Button
                onClick={handleInstallPWA}
                size="lg"
                className="w-full h-20 text-lg font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-pulse"
                variant="default"
              >
                <Download className="mr-3 h-7 w-7" />
                Zainstaluj aplikację
              </Button>
              <p className="text-sm text-center mt-3 font-medium text-foreground">
                💡 Dodaj PortfelIO do ekranu głównego urządzenia
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Przyciski wyboru metody skanowania */}
          <div className="grid gap-4">
            {hasCamera && (
              <Button
                onClick={() => cameraInputRef.current?.click()}
                size="lg"
                className="h-24 text-lg"
                variant="default"
              >
                <Camera className="mr-2 h-6 w-6" />
                Zrób zdjęcie aparatem
              </Button>
            )}

            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="h-24 text-lg"
              variant={hasCamera ? "outline" : "default"}
            >
              <Upload className="mr-2 h-6 w-6" />
              Wybierz z galerii
            </Button>
          </div>

          {/* Ukryte inputy dla plików */}
          {/* Input dla aparatu (capture="environment" otwiera tylny aparat) */}
          {hasCamera && (
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          )}

          {/* Input dla galerii */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Informacje o wymaganiach */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="font-medium mb-2">Wskazówki:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Zrób zdjęcie w dobrym oświetleniu</li>
              <li>Upewnij się, że cały paragon jest widoczny</li>
              <li>Unikaj cieni i odbić światła</li>
              <li>Obsługiwane formaty: JPEG, PNG (max 20MB)</li>
              <li>Wysoka rozdzielczość to lepsza dokładność OCR</li>
            </ul>
          </div>
        </>
      )}

      {/* Dialog z instrukcjami instalacji dla iOS */}
      <IOSInstallInstructions open={showIOSInstructions} onOpenChange={setShowIOSInstructions} />
    </div>
  );
}
