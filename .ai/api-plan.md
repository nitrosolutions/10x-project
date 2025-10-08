# REST API Plan

## 1. Resources

- Category (`categories`)
- Receipt (`receipts`)
- ReceiptItem (`receipt_items`)
- Stats (computed)

## 2. Endpoints

### 2.1 Authentication

All endpoints require a valid Supabase JWT in `Authorization: Bearer <token>`. Supabase Auth handles:

- **Sign Up**: via Supabase client
- **Sign In**: via Supabase client
- **Password Reset**: Supabase endpoint

### 2.2 Categories

- **GET /api/categories**  
  Description: Retrieve the 9 seeded expense categories.  
  Response 200:
  ```json
  [
    { "id": 1, "name": "Food & Drinks", "icon": "🛒", "order": 1 },
    …
  ]
  ```
  Errors:
  - 401 Unauthorized

### 2.3 Receipts

#### 2.3.1 Scan Receipt

- **POST /api/receipts/scan**  
  Description: Upload base64 image for AI analysis; `source` is set to "scan" internally.  
  Request JSON:
  ```json
  { "image": "<base64>" }
  ```
  Response 200:
  ```json
  {
    "id": "<uuid>",
    "purchase_date": "2025-10-01",
    "store_name": "Supermarket",
    "total_amount": 3.5,
    "items": [{ "id": "<uuid>", "product_name": "Milk", "price": 3.5, "category_id": 1 }]
  }
  ```
  Errors:
  - 400 Bad Request (invalid format)
  - 413 Payload Too Large (>10MB)
  - 504 Gateway Timeout (analysis >60s)
  - 500 Internal Server Error

#### 2.3.2 Create Receipt (Manual)

- **POST /api/receipts**  
  Description: Create a new receipt; `source` is set to "manual" internally.  
  Request JSON:
  ```json
  {
    "purchase_date": "2025-10-01",
    "store_name": "Optional Store",
    "items": [{ "product_name": "Bread", "price": 2.0, "category_id": 1 }]
  }
  ```
  Response 201:
  ```json
  {
    "id": "<uuid>",
    "purchase_date": "2025-10-01",
    "store_name": "Optional Store",
    "total_amount": 2.0,
    "items": [{ "id": "<uuid>", "product_name": "Bread", "price": 2.0, "category_id": 1 }]
  }
  ```
  Errors:
  - 400 Bad Request (validation errors)
  - 401 Unauthorized

#### 2.3.3 List Receipts

- **GET /api/receipts?month=YYYY-MM**  
  Description: List all receipts for a month, sorted by `purchase_date` desc.  
  Query:
  - `month` (required): format `YYYY-MM`  
    Response 200:
  ```json
  [
    {
      "id": "<uuid>",
      "purchase_date": "2025-10-01",
      "store_name": "Optional Store",
      "total_amount": 12.0,
      "items": [
        { "id": "<uuid>", "product_name": "Bread", "price": 2.0, "category_id": 1 },
        { "id": "<uuid>", "product_name": "Butter", "price": 3.0, "category_id": 1 }
      ]
    }
  ]
  ```

#### 2.3.4 Get Receipt Details

- **GET /api/receipts/{receiptId}**  
  Description: Retrieve one receipt with its items.  
  Response 200:
  ```json
  {
    "id":"…",
    "purchase_date":"…",
    "store_name":"…",
    "total_amount":12.00,
    "items":[
      { "id":"…", "product_name":"…", "price":…, "category_id":… }
    ]
  }
  ```

#### 2.3.5 Update Receipt

- **PUT /api/receipts/{receiptId}**  
  Description: Update receipt metadata and items; `source` remains unchanged internally.  
  Request JSON:
  ```json
  {
    "purchase_date": "2025-10-02",
    "store_name": "Updated Store"
  }
  ```
  Response 200:
  ```json
  {
    "id": "…",
    "purchase_date": "2025-10-02",
    "store_name": "Updated Store",
    "total_amount": 12.0,
    "items": [{ "id": "<uuid>", "product_name": "Bread", "price": 2.0, "category_id": 1 }]
  }
  ```

#### 2.3.6 Delete Receipt

- **DELETE /api/receipts/{receiptId}**  
  Description: Hard-delete a receipt and its items.  
  Response 204 No Content

#### 2.3.7 Add Receipt Item

- **POST /api/receipts/{receiptId}/items**  
  Description: Add a single receipt item.  
  Request JSON:
  ```json
  { "product_name": "Item Name", "price": 1.23, "category_id": 1 }
  ```
  Response 201:
  ```json
  { "id": "<uuid>", "product_name": "Item Name", "price": 1.23, "category_id": 1 }
  ```
  Errors:
  - 400 Bad Request (validation errors)
  - 401 Unauthorized
  - 404 Not Found (receipt)

#### 2.3.8 Update Receipt Item

- **PUT /api/receipts/{receiptId}/items/{itemId}**  
  Description: Update a single receipt item.  
  Request JSON: same as Add Receipt Item.  
  Response 200:
  ```json
  { "id": "<uuid>", "product_name": "Item Name", "price": 2.0, "category_id": 2 }
  ```
  Errors:
  - 400 Bad Request (validation errors)
  - 401 Unauthorized
  - 404 Not Found (receipt or item)

#### 2.3.9 Delete Receipt Item

- **DELETE /api/receipts/{receiptId}/items/{itemId}**  
  Description: Delete a single receipt item.  
  Response 204 No Content  
  Errors:
  - 401 Unauthorized
  - 404 Not Found

### 2.4 Stats

- **GET /api/stats/monthly?month=YYYY-MM**  
  Description: Aggregate total per category for chart.  
  Response 200:
  ```json
  {
    "month":"2025-10",
    "totals":[
      { "category_id":1, "amount":50.00 },
      …
    ],
    "grand_total": 200.00
  }
  ```

## 3. Authentication & Authorization

- Mechanism: Supabase JWT
- enforcement: RLS policies on `receipts` and `receipt_items` (DB-level)

## 4. Validation & Business Logic

- **Date**: `purchase_date <= today`
- **Items**: array length ≥1
- **Price**: positive NUMERIC(12,2)
- **Category**: must be one of 9 seeded categories
- **total_amount**: DB trigger `trg_recalc_total` recalculates on items change
- **Source**: enum `receipt_source_enum` ∈ {“scan”,“manual”}

Security & Performance:

- RLS enforces per-user data isolation
- Rate limit: 60 requests/min per user (recommendation)
- Client-side file validation (JPEG/PNG ≤10MB)
- AI timeout: 60 seconds with 504 response
