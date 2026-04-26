# US-R05 — Photo Order

**Page:** `/order/photo`
**Role:** Retailer
**Last Updated:** 2026-04-26

---

## Context
The Photo Order page lets retailers order a spare part they cannot identify in the catalog.
Instead of selecting a product by name or SKU, the retailer uploads a photo of the part
(or the location it comes from), provides vehicle details, and selects a vendor. The vendor
receives the photo order and manually fulfils it.

---

## User Stories

---

### US-R05-01 — Upload a Photo of the Part to Order

**As a** retailer,
**I want to** upload a photo of the spare part I need,
**So that** the vendor can visually identify it and supply the correct item.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the Photo Order page | — | A large upload zone is shown with a camera icon and "Click to upload or drag & drop" instruction |
| AC-02 | I click the upload zone | — | A file picker opens filtered to image files |
| AC-03 | I select a valid image | — | A thumbnail preview of the photo is shown with the file size in KB |
| AC-04 | I click "✕" to remove the photo | — | The preview disappears and the upload zone is restored |
| AC-05 | I select a non-image file | — | The file is rejected and an error message is shown |
| AC-06 | The image is uploaded | — | It is automatically converted to WebP format before upload to reduce file size |

---

### US-R05-02 — Specify Vehicle Details for the Part

**As a** retailer,
**I want to** specify the vehicle type, brand, model, and year of manufacture,
**So that** the vendor knows which vehicle the part is for.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the vehicle details section | — | I see: Vehicle Type (button group), Brand (dropdown), Model (dropdown), Year (dropdown) |
| AC-02 | I have not selected a vehicle type | I view the Brand dropdown | It is disabled |
| AC-03 | I have not selected a brand | I view the Model dropdown | It is disabled |
| AC-04 | I select a vehicle type | — | The Brand dropdown populates with brands for that type |
| AC-05 | I select a brand | — | The Model dropdown populates with models for that brand |
| AC-06 | I select a year | — | The year range spans from the current year down to 1999 |

---

### US-R05-03 — Set Quantity and Optional Notes

**As a** retailer,
**I want to** set the quantity needed and add a note,
**So that** the vendor knows exactly how many I need and any additional context.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the form | — | A quantity input is shown with a minimum value of 1 |
| AC-02 | I view the form | — | An optional notes textarea is shown: "Any specific requirement or details…" |
| AC-03 | I set quantity to 0 or negative | I try to submit | Validation prevents submission |

---

### US-R05-04 — Select a Vendor

**As a** retailer,
**I want to** choose which vendor to send this photo order to,
**So that** I can direct the request to the supplier I prefer or who is local to me.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the vendor section | — | All available vendors are listed as selectable buttons showing name and city/state |
| AC-02 | I click a vendor | — | The button highlights with a blue border |
| AC-03 | I have selected a vendor | I view the Place Order button | It reads "Place Order with [Vendor Name]" |
| AC-04 | No vendor is selected | I view the button | It is disabled |

---

### US-R05-05 — Place the Photo Order

**As a** retailer,
**I want to** submit my photo order once all details are filled in,
**So that** the vendor receives the request and can confirm what the part is.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | All required fields are complete (photo, vehicle type, brand, model, year, vendor, quantity) | I click "Place Order" | The photo is uploaded, the order is created, and a success confirmation is shown with the order number |
| AC-02 | Any required field is missing | I click "Place Order" | Submission is blocked and a validation message identifies the missing field |
| AC-03 | The photo upload is in progress | I view the button | It reads "Uploading photo…" and is disabled |
| AC-04 | The order is successfully placed | I view the success state | The order number is shown and a link to track the order is available |
| AC-05 | The order submission fails | — | An error is displayed and the form is preserved so I can retry |
