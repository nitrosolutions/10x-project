# Plan Implementacji: Gemini File API Upload

**Data utworzenia**: 2025-01-22
**Status**: Zaplanowane
**Priorytet**: Wysoki

---

## 🎯 Cel

Zastąpić obecny system przesyłania zdjęć paragonów (base64 inline) na **Gemini File API**, aby:

1. **Ominąć limit Vercel** (4.5MB) - nowy limit to **20MB**
2. **Zachować 100% jakości obrazu** - bez kompresji i artefaktów JPEG
3. **Poprawić dokładność OCR** - cyfry nie są uszkadzane przez kompresję
4. **Uprościć kod** - usunięcie ~200 linii logiki kompresji

---

## 📊 Architektura

### **Obecna architektura (base64 inline)**
```
Frontend: Obraz → compressImage() → fileToBase64() → base64 (max 3MB)
         ↓ JSON body: { image: base64, mimeType }
Backend: POST /api/receipts/scan
         ↓ Parsowanie JSON
         ↓ Walidacja rozmiaru (10MB limit)
         ↓ Gemini API: inlineData: { data: base64, mimeType }
         ↓ Response: JSON z danymi paragonu
```

**Problemy**:
- ❌ Limit Vercel 4.5MB (base64 zwiększa o ~33%)
- ❌ Kompresja JPEG psuje cyfry dla OCR
- ❌ Skomplikowana logika resize + quality adaptation
- ❌ Długi czas przetwarzania w przeglądarce

---

### **Nowa architektura (Gemini File API)**
```
Frontend: Oryginalny plik (max 20MB)
         ↓ FormData: file
Backend: POST /api/receipts/scan
         ↓ Parsowanie FormData
         ↓ Konwersja File → Buffer
         ↓ Upload do Gemini Files API (z retry)
         ↓ Otrzymanie fileUri
         ↓ Gemini API: fileData: { fileUri, mimeType }
         ↓ Response: JSON z danymi paragonu
```

**Korzyści**:
- ✅ Limit 20MB (4.4x więcej)
- ✅ Brak kompresji = 100% jakość
- ✅ Lepszy OCR (cyfry bez artefaktów)
- ✅ Prostszy kod frontend
- ✅ Retry logic dla błędów sieci

---

## 📦 Pliki do modyfikacji

### 1️⃣ **Frontend: `src/components/receipts/ReceiptScanner.tsx`**

#### **DO USUNIĘCIA:**

1. **Flagi rozwojowe** (linie 13-19):
```typescript
const SKIP_IMAGE_COMPRESSION = false;
const SKIP_IMAGE_RESIZE = false;
```

2. **Funkcja `compressImage()`** (linie 62-158):
   - Cała logika resize (4096px → 2560px)
   - Pętla quality compression (95% → 80%)
   - Canvas rendering z `imageSmoothingQuality`
   - Fallback na 80% quality

3. **Funkcja `fileToBase64()`** (linie 154-167):
   - Konwersja File → base64 string
   - Usunięcie prefixu `data:image/xxx;base64,`

4. **Walidacja rozmiaru** w `handleFileSelect()` (linie 186-191):
```typescript
if (file.size > 10 * 1024 * 1024) {
  toast.error("Plik jest za duży", {
    description: "Maksymalny rozmiar pliku to 10MB",
  });
  return;
}
```

5. **Logika kompresji** w `handleFileSelect()` (linie 203-226):
```typescript
if (!SKIP_IMAGE_COMPRESSION) {
  try {
    if (SKIP_IMAGE_RESIZE) { ... }
    fileToUpload = await compressImage(file);
  } catch (compressionError) { ... }
}
```

6. **Konwersja base64** (linia 228):
```typescript
const base64Image = await fileToBase64(fileToUpload);
```

7. **Import typu** (linia 7):
```typescript
import type { ReceiptScanResponse } from "@/lib/schemas/receipt-scan.schema";
```
(Zostanie zastąpiony innym importem później)

#### **DO DODANIA/ZMIANY:**

1. **Uproszczona walidacja** - tylko typ pliku:
```typescript
// Walidacja typu pliku (zostaje bez zmian)
if (!["image/jpeg", "image/png"].includes(file.type)) {
  toast.error("Niewspierany format pliku", {
    description: "Tylko pliki JPEG i PNG są obsługiwane",
  });
  return;
}

// USUŃ walidację rozmiaru - Gemini obsługuje do 2GB
```

2. **Zmiana wysyłania na FormData**:
```typescript
// PRZED (JSON z base64):
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

// PO (FormData z File):
const formData = new FormData();
formData.append("file", file); // Bezpośrednio oryginalny plik

const response = await fetch("/api/receipts/scan", {
  method: "POST",
  body: formData, // Bez Content-Type - przeglądarka ustawi automatycznie
  signal: controller.signal,
});
```

3. **Uproszczony przepływ w `handleFileSelect()`**:
```typescript
// Rozpocznij skanowanie
setIsScanning(true);
setProgress("Przygotowuję obraz...");

try {
  setProgress("Wysyłam obraz do analizy...");

  // Timeout dla zapytania (90s - dłuższe bo upload dużych plików)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  let scannedData;

  try {
    // FormData z oryginalnym plikiem
    const formData = new FormData();
    formData.append("file", file);

    // Wysłanie zapytania do API
    const response = await fetch("/api/receipts/scan", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // ... reszta obsługi response (bez zmian)
```

#### **Komentarze do zaktualizowania**:
```typescript
// PRZED (linia 205):
// Kompresja obrazu - zmniejsza wymiary do max 2560x2560, potem obniża jakość co 2% (95%-80%)
// Balans między jakością dla AI i rozmiarem pliku (limit 3MB dla base64)

// PO:
// Wysyłamy oryginalny plik bezpośrednio - bez kompresji
// Gemini File API obsługuje pliki do 20MB z automatycznym uploadem
```

---

### 2️⃣ **Backend: `src/pages/api/receipts/scan.ts`**

#### **DO ZMIANY:**

1. **Import schematów** (linia 5):
```typescript
// PRZED:
import { ScanReceiptRequestSchema, ReceiptScanResponseSchema } from "@/lib/schemas/receipt-scan.schema";

// PO:
import { ReceiptScanResponseSchema } from "@/lib/schemas/receipt-scan.schema";
```

2. **Usunięcie MAX_IMAGE_SIZE** (linie 10-11):
```typescript
// USUŃ:
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
```

3. **Parsowanie request body** (linie 45-85) - **CAŁKOWITA ZMIANA**:

```typescript
// PRZED (JSON body):
// Krok 2: Parsowanie request body
let requestBody;
try {
  requestBody = await context.request.json();
} catch {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      details: ["Invalid JSON format in request body"],
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// Krok 3: Walidacja danych wejściowych z użyciem Zod schema
const validationResult = ScanReceiptRequestSchema.safeParse(requestBody);
if (!validationResult.success) {
  const errorDetails = validationResult.error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
  return new Response(
    JSON.stringify({ error: "Validation error", details: errorDetails }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

const { image, mimeType } = validationResult.data;

// PO (FormData):
// Krok 2: Parsowanie FormData z pliku
let formData: FormData;
try {
  formData = await context.request.formData();
} catch (parseError) {
  // eslint-disable-next-line no-console
  console.error("[POST /api/receipts/scan] FormData parsing error:", parseError);
  return new Response(
    JSON.stringify({
      error: "Validation error",
      details: ["Invalid FormData format in request body"],
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// Krok 3: Walidacja pliku
const file = formData.get("file") as File | null;

if (!file) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      details: ["Brak pliku w żądaniu"],
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// Walidacja typu pliku
if (!["image/jpeg", "image/png"].includes(file.type)) {
  return new Response(
    JSON.stringify({
      error: "Validation error",
      details: ["Niewspierany format pliku (tylko JPEG, PNG)"],
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

// eslint-disable-next-line no-console
console.log("[POST /api/receipts/scan] File received:", {
  name: file.name,
  type: file.type,
  size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
});
```

4. **Usunięcie walidacji rozmiaru** (linie 89-107):
```typescript
// USUŃ cały blok "Krok 4: Sprawdzenie rozmiaru obrazu"
// Gemini File API obsługuje do 2GB, więc nie potrzebujemy walidacji
```

5. **Nowy krok: Upload do Gemini Files API** (DODAJ przed "Krok 6: Przygotowanie promptu"):

```typescript
// Krok 5: Upload pliku do Gemini Files API z retry logic
const geminiService = new GeminiService();

let uploadedFile: { uri: string; mimeType: string };
const MAX_RETRIES = 2;
let lastError: Error | unknown;

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  try {
    // eslint-disable-next-line no-console
    console.log(`[POST /api/receipts/scan] File upload attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

    // Konwertuj File na Buffer dla Node.js
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload do Gemini Files API
    uploadedFile = await geminiService.uploadFile(buffer, file.type, file.name);

    // eslint-disable-next-line no-console
    console.log("[POST /api/receipts/scan] File uploaded successfully:", {
      uri: uploadedFile.uri,
      mimeType: uploadedFile.mimeType,
    });

    break; // Sukces - wyjdź z pętli retry
  } catch (error) {
    lastError = error;
    // eslint-disable-next-line no-console
    console.error(`[POST /api/receipts/scan] File upload attempt ${attempt + 1} failed:`, error);

    if (attempt < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s
      const delayMs = 1000 * Math.pow(2, attempt);
      // eslint-disable-next-line no-console
      console.log(`[POST /api/receipts/scan] Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

if (!uploadedFile!) {
  // eslint-disable-next-line no-console
  console.error("[POST /api/receipts/scan] File upload failed after all retries:", lastError);

  return new Response(
    JSON.stringify({
      error: "File Upload Error",
      details: [
        lastError instanceof Error
          ? `Nie udało się przesłać pliku do serwera AI: ${lastError.message}`
          : "Nie udało się przesłać pliku do serwera AI. Spróbuj ponownie.",
      ],
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
```

6. **"Krok 6: Przygotowanie promptu"** (linie 134-273) - **BEZ ZMIAN**
   - Prompt pozostaje identyczny

7. **"Krok 7: Wywołanie Gemini API"** (linie 275-317) - **ZMIANA CONTENTS**:

```typescript
// PRZED (inline data):
// Krok 7: Wywołanie Gemini API z obrazem
let geminiResponse;
try {
  // Przygotowanie zawartości multimodal (obraz + tekst)
  const contents = [
    {
      inlineData: {
        data: image,
        mimeType,
      },
    },
    {
      text: prompt,
    },
  ];

  geminiResponse = await geminiService.generateContent(contents, {
    temperature: 0.1,
    maxOutputTokens: 2048,
  });
} catch (error) { ... }

// PO (fileUri):
// Krok 7: Wywołanie Gemini API z uploadowanym plikiem
let geminiResponse;
try {
  // Przygotowanie zawartości multimodal (fileUri + tekst)
  const contents = [
    {
      fileData: {
        fileUri: uploadedFile.uri,
        mimeType: uploadedFile.mimeType,
      },
    },
    {
      text: prompt,
    },
  ];

  // eslint-disable-next-line no-console
  console.log("[POST /api/receipts/scan] Calling Gemini API with file URI");

  geminiResponse = await geminiService.generateContent(contents, {
    temperature: 0.1,
    maxOutputTokens: 2048,
  });
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("[POST /api/receipts/scan] Gemini API error:", error);

  return new Response(
    JSON.stringify({
      error: "AI Processing Error",
      details: [
        error instanceof Error
          ? error.message
          : "Nie udało się przetworzyć paragonu. Spróbuj ponownie lub dodaj ręcznie.",
      ],
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
```

8. **Kroki 8-11** (parsowanie, walidacja, logowanie, response) - **BEZ ZMIAN**
   - Cała reszta pozostaje identyczna

#### **Numeracja kroków po zmianach:**
```
Krok 1: Sprawdzenie autoryzacji użytkownika (bez zmian)
Krok 2: Parsowanie FormData z pliku (ZMIANA)
Krok 3: Walidacja pliku (ZMIANA)
Krok 4: Pobranie kategorii z bazy danych (bez zmian, ale zmiana numeru z "Krok 5")
Krok 5: Upload pliku do Gemini Files API (NOWY)
Krok 6: Przygotowanie promptu dla Gemini (bez zmian, ale zmiana numeru z "Krok 6")
Krok 7: Wywołanie Gemini API z uploadowanym plikiem (ZMIANA)
Krok 8: Parsowanie odpowiedzi z Gemini (bez zmian, zmiana numeru)
Krok 9: Walidacja odpowiedzi z Gemini (bez zmian, zmiana numeru)
Krok 10: Logowanie pomyślnej odpowiedzi z AI (bez zmian, dodane wcześniej)
Krok 11: Zwrócenie odpowiedzi 200 OK (bez zmian, zmiana numeru)
```

---

### 3️⃣ **GeminiService: `src/lib/services/geminiService.ts`**

#### **DO DODANIA:**

1. **Nowa metoda `uploadFile()`** (dodaj po `generateContent()`):

```typescript
/**
 * Przesyła plik do Gemini Files API
 *
 * Gemini Files API pozwala na upload plików do 2GB i przechowuje je przez 48h.
 * Każdy projekt może przechowywać do 20GB plików łącznie.
 *
 * @param fileBuffer - Buffer z zawartością pliku (otrzymany z File.arrayBuffer())
 * @param mimeType - Typ MIME pliku (image/jpeg lub image/png)
 * @param fileName - Nazwa pliku (opcjonalna, używana jako displayName w Gemini)
 * @returns Promise z obiektem { uri: string, mimeType: string } do użycia w generateContent()
 * @throws Error jeśli upload się nie powiedzie lub plik jest nieprawidłowy
 *
 * @example
 * ```typescript
 * const file = await request.formData().get("file") as File;
 * const arrayBuffer = await file.arrayBuffer();
 * const buffer = Buffer.from(arrayBuffer);
 *
 * const uploadedFile = await geminiService.uploadFile(buffer, file.type, file.name);
 * // uploadedFile.uri można użyć w generateContent()
 * ```
 */
async uploadFile(
  fileBuffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<{ uri: string; mimeType: string }> {
  // Walidacja parametrów
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer nie może być pusty");
  }

  if (!["image/jpeg", "image/png"].includes(mimeType)) {
    throw new Error(`Niewspierany typ pliku: ${mimeType} (tylko image/jpeg, image/png)`);
  }

  try {
    // Upload do Gemini Files API
    // API zwraca obiekt z polami: name, uri, mimeType, createTime, updateTime, state, etc.
    const uploadResult = await this.#client.files.upload({
      file: fileBuffer,
      config: {
        mimeType,
        displayName: fileName || `receipt-${Date.now()}`,
      },
    });

    // Walidacja odpowiedzi z API
    if (!uploadResult || !uploadResult.uri) {
      throw new Error("Gemini Files API nie zwróciło URI pliku");
    }

    // eslint-disable-next-line no-console
    console.log("[GeminiService] File uploaded successfully:", {
      uri: uploadResult.uri,
      name: uploadResult.name,
      displayName: fileName,
      mimeType: uploadResult.mimeType,
      sizeBytes: fileBuffer.length,
    });

    return {
      uri: uploadResult.uri,
      mimeType: uploadResult.mimeType || mimeType,
    };
  } catch (error) {
    // Logowanie szczegółów błędu
    // eslint-disable-next-line no-console
    console.error("[GeminiService] File upload error:", {
      error: error instanceof Error ? error.message : String(error),
      fileName,
      mimeType,
      bufferSize: fileBuffer.length,
    });

    // Rzuć szczegółowy błąd
    if (error instanceof Error) {
      throw new Error(`Gemini Files upload failed: ${error.message}`);
    }
    throw new Error("Gemini Files upload failed: Unknown error");
  }
}
```

#### **Bez zmian w:**
- Constructor
- `generateContent()` - pozostaje bez zmian, tylko użyjemy go z innymi contents

---

### 4️⃣ **Schematy: `src/lib/schemas/receipt-scan.schema.ts`**

#### **DO USUNIĘCIA:**

```typescript
// USUŃ (linie 24-34):
/**
 * Schema dla request body do endpointu /api/receipts/scan
 */
export const ScanReceiptRequestSchema = z.object({
  image: z.string().min(1, "Obraz nie może być pusty"),
  mimeType: z.enum(["image/jpeg", "image/png"], {
    errorMap: () => ({ message: "Niewspierany format pliku (tylko JPEG, PNG)" }),
  }),
});

export type ScanReceiptRequest = z.infer<typeof ScanReceiptRequestSchema>;
```

#### **DO DODANIA/ZMIANY:**

1. **Komentarz wyjaśniający** (zastępuje usunięty schema):
```typescript
/**
 * UWAGA: Request body dla /api/receipts/scan to FormData (multipart/form-data), nie JSON.
 *
 * Format request:
 * - Content-Type: multipart/form-data
 * - Body: FormData z polem "file" (File object)
 *
 * Plik jest uploadowany bezpośrednio do Gemini Files API (limit 2GB, storage 48h).
 * Walidacja typu pliku (image/jpeg, image/png) wykonywana jest w endpoincie.
 *
 * Schema poniżej (ReceiptScanResponseSchema) jest używana tylko dla walidacji
 * odpowiedzi z Gemini AI, nie dla request body.
 */
```

#### **Bez zmian w:**
- `ReceiptScanResponseSchema` (linie 7-20)
- `ReceiptScanResponse` type (linia 22)

---

## 🔄 Przepływ danych (szczegółowy)

### **Krok po kroku:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (ReceiptScanner.tsx)                               │
├─────────────────────────────────────────────────────────────────┤
│ Użytkownik wybiera zdjęcie z aparatu lub galerii               │
│   ↓                                                              │
│ Walidacja typu pliku: image/jpeg lub image/png                 │
│   ↓                                                              │
│ USUŃ: Kompresja obrazu (compressImage)                         │
│ USUŃ: Konwersja do base64 (fileToBase64)                       │
│   ↓                                                              │
│ Tworzenie FormData:                                             │
│   const formData = new FormData();                              │
│   formData.append("file", file); // Oryginalny plik             │
│   ↓                                                              │
│ POST /api/receipts/scan                                         │
│   - Method: POST                                                │
│   - Body: formData (multipart/form-data)                        │
│   - Signal: AbortController (timeout 90s)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BACKEND (scan.ts) - PARSOWANIE                              │
├─────────────────────────────────────────────────────────────────┤
│ Sprawdzenie autoryzacji (userId)                               │
│   ↓                                                              │
│ Parsowanie FormData:                                            │
│   const formData = await context.request.formData();            │
│   const file = formData.get("file") as File;                    │
│   ↓                                                              │
│ Walidacja pliku:                                                │
│   - Czy plik istnieje?                                          │
│   - Czy typ to image/jpeg lub image/png?                        │
│   ↓                                                              │
│ USUŃ: Walidacja rozmiaru (10MB limit)                          │
│   ↓                                                              │
│ Pobranie kategorii z Supabase (bez zmian)                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND (scan.ts) - UPLOAD DO GEMINI                        │
├─────────────────────────────────────────────────────────────────┤
│ Konwersja File → Buffer:                                        │
│   const arrayBuffer = await file.arrayBuffer();                 │
│   const buffer = Buffer.from(arrayBuffer);                      │
│   ↓                                                              │
│ RETRY LOOP (max 2 próby z exponential backoff):                │
│   for (let attempt = 0; attempt <= 2; attempt++)                │
│     ↓                                                            │
│     Wywołanie geminiService.uploadFile(buffer, type, name)      │
│       ↓ (poniżej)                                               │
│     Jeśli sukces: break z pętli                                 │
│     Jeśli błąd && attempt < 2:                                  │
│       - Exponential backoff: 1s, 2s                             │
│       - Retry                                                    │
│   ↓                                                              │
│ Jeśli wszystkie próby zawiodły:                                 │
│   - Return 500 Error: "Nie udało się przesłać pliku..."        │
│   ↓                                                              │
│ Jeśli sukces:                                                   │
│   - uploadedFile = { uri: string, mimeType: string }            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. GEMINI SERVICE (geminiService.ts) - UPLOAD FILE             │
├─────────────────────────────────────────────────────────────────┤
│ Metoda: uploadFile(buffer, mimeType, fileName)                 │
│   ↓                                                              │
│ Walidacja parametrów:                                           │
│   - buffer nie pusty                                            │
│   - mimeType: image/jpeg lub image/png                          │
│   ↓                                                              │
│ Wywołanie Gemini Files API:                                     │
│   await this.#client.files.upload({                             │
│     file: buffer,                                               │
│     config: {                                                   │
│       mimeType,                                                 │
│       displayName: fileName || `receipt-${Date.now()}`,         │
│     }                                                            │
│   });                                                            │
│   ↓                                                              │
│ Walidacja response:                                             │
│   - Czy uploadResult.uri istnieje?                              │
│   ↓                                                              │
│ Return: { uri: string, mimeType: string }                       │
│   ↓                                                              │
│ W przypadku błędu: throw Error z szczegółami                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND (scan.ts) - WYWOŁANIE GEMINI AI                     │
├─────────────────────────────────────────────────────────────────┤
│ Przygotowanie promptu (bez zmian)                              │
│   ↓                                                              │
│ ZMIANA: Przygotowanie contents z fileUri:                       │
│   const contents = [                                            │
│     {                                                            │
│       fileData: {                                               │
│         fileUri: uploadedFile.uri,                              │
│         mimeType: uploadedFile.mimeType,                        │
│       },                                                         │
│     },                                                           │
│     {                                                            │
│       text: prompt,                                             │
│     },                                                           │
│   ];                                                             │
│   ↓                                                              │
│ Wywołanie Gemini generateContent:                               │
│   geminiResponse = await geminiService.generateContent(         │
│     contents,                                                   │
│     { temperature: 0.1, maxOutputTokens: 2048 }                 │
│   );                                                             │
│   ↓                                                              │
│ W przypadku błędu: Return 500 "AI Processing Error"            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. BACKEND (scan.ts) - PARSOWANIE I WALIDACJA (bez zmian)      │
├─────────────────────────────────────────────────────────────────┤
│ Parsowanie JSON z geminiResponse.text                          │
│   - Usunięcie markdown code blocks (```json...```)             │
│   - Wyciągnięcie JSON przez { ... }                            │
│   ↓                                                              │
│ Walidacja ReceiptScanResponseSchema.safeParse()                │
│   ↓                                                              │
│ Logowanie AI Response (console.log full JSON)                  │
│   ↓                                                              │
│ Return 200 OK z JSON: ReceiptScanResponse                       │
│   {                                                              │
│     purchase_date: "2025-01-22",                                │
│     store_name: "Biedronka",                                    │
│     items: [                                                    │
│       { name: "Mleko", price: 4.59, category_id: 1 },          │
│       { name: "Chleb", price: 3.99, category_id: 1 },          │
│     ],                                                           │
│     total: 8.58                                                 │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. FRONTEND (ReceiptScanner.tsx) - OBSŁUGA RESPONSE            │
├─────────────────────────────────────────────────────────────────┤
│ Odbiór JSON response (bez zmian)                               │
│   ↓                                                              │
│ Zapis do sessionStorage:                                        │
│   sessionStorage.setItem("scannedReceipt", JSON.stringify({    │
│     ...scannedData,                                             │
│     source: "scan",                                             │
│   }));                                                           │
│   ↓                                                              │
│ Redirect: window.location.href = "/receipts/new?mode=scan"     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Plan testowania

### **Testy manualne (po implementacji):**

| # | Scenariusz | Oczekiwany rezultat | Priorytet |
|---|-----------|---------------------|-----------|
| 1 | Małe zdjęcie (< 1MB, JPEG) | ✅ Skanowanie działa, ceny poprawne | 🔴 Krytyczny |
| 2 | Średnie zdjęcie (2-4MB, JPEG) | ✅ Skanowanie działa, omija limit Vercel | 🔴 Krytyczny |
| 3 | Duże zdjęcie (10-20MB, JPEG) | ✅ Upload działa, timeout wystarczający | 🟡 Średni |
| 4 | Zdjęcie PNG (2-5MB) | ✅ Obsługiwane, działa poprawnie | 🟡 Średni |
| 5 | Błędny format (.gif, .bmp) | ❌ Walidacja odrzuca z komunikatem | 🟢 Niski |
| 6 | Bardzo duże zdjęcie (> 20MB) | ❌ Gemini API odrzuca (nie frontend) | 🟢 Niski |
| 7 | Network timeout podczas uploadu | 🔄 Retry działa (2 próby) | 🟡 Średni |
| 8 | Network error (brak internetu) | ❌ Komunikat "Sprawdź połączenie" | 🟢 Niski |
| 9 | OCR accuracy test (cyfry z przecinkiem) | ✅ Ceny poprawnie rozpoznane (np. 12.99) | 🔴 Krytyczny |
| 10 | AI Response logging w console | ✅ Console pokazuje pełny JSON z cenami | 🟡 Średni |

### **Testy automatyczne (opcjonalnie, do rozważenia później):**

```typescript
// Przykład testu jednostkowego dla GeminiService.uploadFile()
describe("GeminiService.uploadFile()", () => {
  it("should upload file and return uri", async () => {
    const mockBuffer = Buffer.from("fake-image-data");
    const result = await geminiService.uploadFile(mockBuffer, "image/jpeg", "test.jpg");

    expect(result).toHaveProperty("uri");
    expect(result).toHaveProperty("mimeType", "image/jpeg");
  });

  it("should throw error for invalid mimeType", async () => {
    const mockBuffer = Buffer.from("fake-image-data");

    await expect(
      geminiService.uploadFile(mockBuffer, "image/gif", "test.gif")
    ).rejects.toThrow("Niewspierany typ pliku");
  });
});
```

---

## ⚠️ Potencjalne ryzyka i mitygacje

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| **Upload timeout dla dużych plików (20MB)** | Średnie | Wysoki | Timeout zwiększony do 90s, retry logic z exponential backoff |
| **Gemini Files API rate limit (429)** | Niskie | Średni | Retry logic obsługuje błędy 429, exponential backoff |
| **Buffer.from() nie działa w Vercel serverless** | Bardzo niskie | Krytyczny | Buffer to Node.js built-in, działa w Vercel. Testować lokalnie najpierw. |
| **FormData parsing w Astro request** | Niskie | Wysoki | Astro obsługuje FormData z box. Dokumentacja potwierdza. |
| **Gemini Files storage limit (20GB per project)** | Bardzo niskie | Niski | Automatyczne usuwanie po 48h. Monitoring zużycia. |
| **AI response quality bez kompresji** | Bardzo niskie | Niski | Oczekiwana poprawa jakości. Testować porównawczo. |
| **Upload failed po wszystkich retry** | Średnie | Średni | Jasny komunikat użytkownikowi: "Sprawdź połączenie, spróbuj ponownie" |
| **File.arrayBuffer() brak wsparcia w starych przeglądarkach** | Niskie | Niski | `arrayBuffer()` wspierane od Chrome 76+, Firefox 69+, Safari 14+. Dobra kompatybilność. |

---

## 📊 Metryki sukcesu

### **Przed implementacją (baseline):**
- ❌ Max rozmiar pliku: **~3MB** (limit Vercel 4.5MB - base64 overhead)
- ⚠️ Kompresja obrazu: **95%-80% quality**, resize do 2560px
- ⚠️ OCR accuracy: **Problemy z cyframi po przecinku** (12.99 → 12.9 lub 12)
- ⚠️ Czas przetwarzania: **5-10s** (kompresja w przeglądarce + upload + AI)
- 📝 Linie kodu kompresji: **~200 linii** (compressImage + fileToBase64 + flagi)

### **Po implementacji (target):**
- ✅ Max rozmiar pliku: **20MB** (limit Gemini Files API)
- ✅ Kompresja obrazu: **Brak** (oryginał 100% jakości)
- ✅ OCR accuracy: **Poprawne ceny** (12.99 → 12.99, bez artefaktów)
- ⚡ Czas przetwarzania: **3-8s** (upload bezpośredni + AI, bez kompresji)
- 🧹 Linie kodu kompresji: **0 linii** (usunięte)

### **KPIs do monitorowania:**

1. **Upload success rate**: > 95% (z retry logic)
2. **OCR accuracy (ceny)**: 100% zgodność dla czytelnych paragonów
3. **Średni czas skanowania**: < 10s (90th percentile)
4. **Error rate (timeout)**: < 5%
5. **Retry rate**: < 10% (większość uploadu działa za 1. razem)

---

## 🚀 Harmonogram implementacji

### **Faza 1: Backend (GeminiService + scan.ts)** - Priorytet 1
**Czas: ~2h**

1. ✅ Dodać metodę `uploadFile()` do `GeminiService.ts` (30 min)
2. ✅ Zmienić parsowanie request body w `scan.ts` (JSON → FormData) (30 min)
3. ✅ Dodać logikę uploadu z retry w `scan.ts` (30 min)
4. ✅ Zmienić wywołanie Gemini API (inlineData → fileData) (15 min)
5. ✅ Usunąć `ScanReceiptRequestSchema` z `receipt-scan.schema.ts` (15 min)

### **Faza 2: Frontend (ReceiptScanner.tsx)** - Priorytet 2
**Czas: ~1.5h**

1. ✅ Usunąć funkcje `compressImage()` i `fileToBase64()` (15 min)
2. ✅ Usunąć flagi `SKIP_IMAGE_COMPRESSION` i `SKIP_IMAGE_RESIZE` (5 min)
3. ✅ Usunąć logikę kompresji w `handleFileSelect()` (15 min)
4. ✅ Usunąć walidację rozmiaru 10MB (5 min)
5. ✅ Zmienić wysyłanie na FormData zamiast JSON+base64 (30 min)
6. ✅ Zaktualizować komentarze i komunikaty użytkownika (20 min)

### **Faza 3: Testy manualne** - Priorytet 3
**Czas: ~1h**

1. ✅ Test małego zdjęcia (< 1MB) (10 min)
2. ✅ Test średniego zdjęcia (2-4MB) (10 min)
3. ✅ Test dużego zdjęcia (10-20MB) (10 min)
4. ✅ Test błędnego formatu (.gif) (5 min)
5. ✅ Test network timeout (symulacja) (10 min)
6. ✅ Weryfikacja OCR accuracy (porównanie przed/po) (15 min)

### **Faza 4: Monitoring i optymalizacja** - Priorytet 4
**Czas: ~30 min**

1. ✅ Sprawdzenie logów AI Response w produkcji (10 min)
2. ✅ Monitoring error rate i retry rate (10 min)
3. ✅ Ewentualne zwiększenie timeout jeśli potrzebne (10 min)

**TOTAL ESTIMATED TIME: ~5h**

---

## 📝 Checklist implementacji

### **Backend:**
- [ ] Dodać `uploadFile()` do `GeminiService.ts`
- [ ] Zmienić parsowanie na FormData w `scan.ts`
- [ ] Dodać retry logic dla uploadu (2x, exponential backoff)
- [ ] Zmienić contents na `fileData: { fileUri, mimeType }`
- [ ] Usunąć `ScanReceiptRequestSchema` z schematów
- [ ] Usunąć walidację rozmiaru 10MB
- [ ] Zaktualizować import schematów (bez `ScanReceiptRequestSchema`)
- [ ] Dodać logi dla upload success/failure
- [ ] Zaktualizować timeout na 90s (dla dużych plików)

### **Frontend:**
- [ ] Usunąć funkcję `compressImage()` (linie 62-158)
- [ ] Usunąć funkcję `fileToBase64()` (linie 154-167)
- [ ] Usunąć flagi `SKIP_IMAGE_COMPRESSION` i `SKIP_IMAGE_RESIZE`
- [ ] Usunąć logikę kompresji w `handleFileSelect()`
- [ ] Usunąć walidację rozmiaru 10MB
- [ ] Zmienić wysyłanie na FormData
- [ ] Zaktualizować timeout na 90s
- [ ] Zaktualizować komunikat progress: "Wysyłam obraz do analizy..."
- [ ] Zaktualizować komentarze w kodzie

### **Dokumentacja:**
- [ ] Zaktualizować komentarze w `receipt-scan.schema.ts`
- [ ] Dodać JSDoc dla `uploadFile()` w `GeminiService.ts`
- [ ] Zaktualizować komentarze w `scan.ts` (numeracja kroków)

### **Testy:**
- [ ] Test małego zdjęcia (< 1MB)
- [ ] Test średniego zdjęcia (2-4MB)
- [ ] Test dużego zdjęcia (10-20MB)
- [ ] Test błędnego formatu
- [ ] Test network timeout
- [ ] Weryfikacja OCR accuracy (ceny)
- [ ] Sprawdzenie logów AI Response

---

## 🎉 Oczekiwane rezultaty

Po pomyślnej implementacji spodziewamy się:

1. ✅ **Brak problemów z limitami** - pliki do 20MB działają bez problemu
2. ✅ **Lepsza jakość OCR** - cyfry po przecinku (12.99) rozpoznawane poprawnie
3. ✅ **Prostszy kod** - usunięcie ~200 linii logiki kompresji
4. ✅ **Szybsze skanowanie** - brak czasu na kompresję w przeglądarce
5. ✅ **Lepsze UX** - jasne komunikaty, retry w przypadku błędów
6. ✅ **Łatwiejsze debugowanie** - logi AI response w konsoli

---

## 📞 Kontakt i wsparcie

W przypadku pytań lub problemów podczas implementacji:
- Konsultacja z dokumentacją: https://ai.google.dev/api/files
- Gemini SDK repo: https://github.com/googleapis/js-genai
- Astro FormData: https://docs.astro.build/en/guides/endpoints/

---

**Koniec planu implementacji**

**Status**: ✅ Gotowy do wykonania
**Data ostatniej aktualizacji**: 2025-01-22
**Autor**: Claude (Haiku 4.5)
