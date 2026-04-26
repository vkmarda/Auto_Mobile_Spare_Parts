# US-V05 — Product Catalog (VendorProducts)

**Page:** `/vendor/products`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Products page lets vendors manage their spare parts catalog. Vendors can add new products
with a name, SKU, description, and stock quantity, and edit existing ones. Stock status is
surfaced visually so the vendor can identify critical items at a glance.

---

## User Stories

---

### US-V05-01 — View Product Catalog

**As a** vendor,
**I want to** see a list of all my products with their stock status,
**So that** I can monitor my inventory and identify items that need restocking.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the Products page | — | I see a table listing all products with columns: Name, SKU, Stock Status, and an Edit action |
| AC-02 | A product has stock ≥ 50 | I view the row | The stock badge shows "In Stock" in green |
| AC-03 | A product has stock between 10 and 49 | I view the row | The stock badge shows "Low Stock" in yellow/amber |
| AC-04 | A product has stock between 1 and 9 | I view the row | The stock badge shows "Critical" in red |
| AC-05 | A product has stock = 0 | I view the row | The stock badge shows "Out of Stock" in red |
| AC-06 | No products exist | I open the page | An empty state is shown with a prompt to add the first product |
| AC-07 | I view the page header | — | The total product count is displayed |

---

### US-V05-02 — Add a New Product

**As a** vendor,
**I want to** add a new spare part to my catalog,
**So that** retailers can find and order it.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "+ Add Product" | — | A modal opens with fields: Name, SKU, Description (optional), Stock quantity |
| AC-02 | I fill in all required fields and click "Save" | — | The product is created, the modal closes, and the new product appears in the table |
| AC-03 | I leave Name or SKU blank | I click "Save" | Validation prevents submission and the empty field is highlighted |
| AC-04 | I enter a SKU that already exists | I click "Save" | An error message is shown: "SKU already in use" (or similar); the modal stays open |
| AC-05 | I click "Cancel" | — | The modal closes without saving |

---

### US-V05-03 — Edit an Existing Product

**As a** vendor,
**I want to** update the details or stock quantity of an existing product,
**So that** the catalog stays accurate as inventory changes.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "Edit" on a product row | — | The add/edit modal opens pre-populated with the product's current values |
| AC-02 | I change the Name and click "Save" | — | The product is updated, the modal closes, and the table reflects the new name |
| AC-03 | I change the SKU to one already used by another product | I click "Save" | An error is shown and the save is prevented |
| AC-04 | I change the stock to a new quantity and click "Save" | — | The stock badge updates to reflect the new value |
| AC-05 | I click "Cancel" in edit mode | — | The modal closes and the product is unchanged |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-V05-01 | Performance | Product list must render within 1.5 seconds |
| NFR-V05-02 | Usability | The add/edit modal must be accessible via keyboard (Tab, Enter, Escape) |
| NFR-V05-03 | Data Integrity | SKU values must be unique across all products for a vendor |
| NFR-V05-04 | Data Integrity | Stock quantity must be a non-negative integer |
| NFR-V05-05 | Security | Only the owning vendor can create or edit their products |
