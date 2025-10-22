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

  // Funkcja pomocnicza do kompresji obrazu (szczególnie ważne dla mobile)
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          // Maksymalna szerokość/wysokość dla OCR
          // 3200px to dobry balans - wystarczająco duże dla OCR, ale zmniejsza ogromne zdjęcia
          const MAX_WIDTH = 3200;
          const MAX_HEIGHT = 3200;
          let width = img.width;
          let height = img.height;
          let needsResize = false;

          // Oblicz nowe wymiary zachowując proporcje
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
              needsResize = true;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
              needsResize = true;
            }
          }

          // Jeśli obraz jest już mały i plik nie jest za duży, nie kompresuj
          // Oszczędza jakość dla małych zdjęć z dobrej jakości
          if (!needsResize && file.size < 2 * 1024 * 1024) {
            // eslint-disable-next-line no-console
            console.log("[ReceiptScanner] Image compression skipped - already optimal size", {
              dimensions: `${img.width}x${img.height}`,
              sizeKB: Math.round(file.size / 1024),
            });
            resolve(file);
            return;
          }

          // Utwórz canvas do kompresji
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Nie udało się utworzyć kontekstu canvas"));
            return;
          }

          // Rysuj obraz na canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Konwertuj canvas do blob z kompresją
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Nie udało się skompresować obrazu"));
                return;
              }

              // Utwórz nowy File z skompresowanego blob
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              // eslint-disable-next-line no-console
              console.log("[ReceiptScanner] Image compression", {
                originalSize: Math.round(file.size / 1024),
                compressedSize: Math.round(compressedFile.size / 1024),
                originalDimensions: `${img.width}x${img.height}`,
                compressedDimensions: `${width}x${height}`,
                compressionRatio: Math.round((compressedFile.size / file.size) * 100),
              });

              resolve(compressedFile);
            },
            "image/jpeg",
            0.92 // Jakość JPEG 92% - wysoka jakość dla OCR przy zachowaniu kompresji
          );
        };
        img.onerror = () => reject(new Error("Nie udało się załadować obrazu"));
      };
      reader.onerror = () => reject(new Error("Nie udało się odczytać pliku"));
    });
  };

  // Funkcja pomocnicza do konwersji pliku na base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Usuń prefix "data:image/xxx;base64,"
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
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

    // Walidacja rozmiaru (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Plik jest za duży", {
        description: "Maksymalny rozmiar pliku to 10MB",
      });
      return;
    }

    // Rozpocznij skanowanie
    setIsScanning(true);
    setProgress("Przygotowuję obraz...");

    try {
      // KLUCZOWE dla mobile: Kompresuj obraz przed wysłaniem
      // Zdjęcia z aparatu mobilnego mogą mieć 5-10MB, co przekracza limit Vercel (4.5MB)
      setProgress("Optymalizuję obraz...");
      let fileToUpload = file;

      try {
        fileToUpload = await compressImage(file);
      } catch (compressionError) {
        // eslint-disable-next-line no-console
        console.warn("[ReceiptScanner] Image compression failed, using original file:", compressionError);
        // Jeśli kompresja się nie powiedzie, użyj oryginalnego pliku
        fileToUpload = file;
      }

      // Konwersja obrazu (skompresowanego lub oryginalnego) na base64
      const base64Image = await fileToBase64(fileToUpload);

      setProgress("Analizuję paragon...");

      // eslint-disable-next-line no-console
      console.log("[ReceiptScanner] Starting scan request", {
        imageSize: base64Image.length,
        mimeType: fileToUpload.type,
        estimatedSizeKB: Math.round((base64Image.length * 3) / 4 / 1024),
      });

      // Timeout dla zapytania (60s - dłuższe dla urządzeń mobilnych)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      let scannedData;

      try {
        // Wysłanie zapytania do API
        const response = await fetch("/api/receipts/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
            mimeType: fileToUpload.type,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // eslint-disable-next-line no-console
        console.log("[ReceiptScanner] Received response", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          ok: response.ok,
        });

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
              if (response.status === 413) {
                errorMessage = "Plik jest za duży. Spróbuj zmniejszyć rozdzielczość zdjęcia.";
              } else if (response.status === 500) {
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

      // Pokaż szczegółowy błąd dla debugowania mobile
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}${error.stack ? "\n" + error.stack.substring(0, 200) : ""}`
          : String(error);

      toast.error("Błąd skanowania", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie lub dodaj paragon ręcznie",
        duration: 10000, // Dłużej na mobile żeby zdążyć przeczytać
      });

      // Dodatkowy toast ze szczegółami technicznymi (tylko dla debugowania)
      if (process.env.NODE_ENV === "development" || window.location.hostname === "localhost") {
        toast.info("Szczegóły techniczne", {
          description: errorDetails.substring(0, 150),
          duration: 15000,
        });
      }

      setIsScanning(false);
      setProgress("");
    }
  };

  // Obsługa kliknięcia przycisku aparatu
  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Obsługa kliknięcia przycisku galerii
  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
              <Button onClick={handleCameraClick} size="lg" className="h-24 text-lg" variant="default">
                <Camera className="mr-2 h-6 w-6" />
                Zrób zdjęcie aparatem
              </Button>
            )}

            <Button
              onClick={handleGalleryClick}
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
              <li>Obsługiwane formaty: JPEG, PNG (max 10MB)</li>
            </ul>
          </div>
        </>
      )}

      {/* Dialog z instrukcjami instalacji dla iOS */}
      <IOSInstallInstructions open={showIOSInstructions} onOpenChange={setShowIOSInstructions} />
    </div>
  );
}
