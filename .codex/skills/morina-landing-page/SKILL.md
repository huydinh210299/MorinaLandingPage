---
name: morina-landing-page
description: Create or update the static Vietnamese Morina landing page with dress and accessory tabs from the repository's local catalog data. Use for the customer-facing gallery; do not use for authenticated RentalShop administration.
---

# Morina Landing Page

Maintain the static, customer-facing catalog in this repository. It is independent from RentalShop's back-office application: do not add Express, Mongoose, EJS, authentication, or database dependencies.

## Project structure

- The published site is the repository root: `index.html`, `styles.css`, `app.js`, and `catalog-data.json`.
- Source CSV files live at the root: `image_link.csv`, `accessories.csv`, and `size.csv`.
- The live catalog and its current dress prices are held in `catalog-data.json`. Preserve an existing product's prices and category when refreshing image data; do not invent missing prices or product codes.
- Run a local static server to test. Do not open `index.html` via `file://`, because the catalog is fetched at runtime.

## Catalog data rules

- Derive a dress code from the final `Folder Path` segment and the leading number of `Original Name`, uppercasing the category and padding the number to two digits. For example, `dress images/VN` with `28.jpg` is `VN28`.
- Build Drive image URLs as `https://drive.google.com/thumbnail?id=<id>&sz=w1000` when a Drive ID can be extracted; fall back to `Direct Image Link` only when no ID is available.
- Retain only these public category codes: `AD`, `AL`, `CB`, `G`, `HN`, `M`, `N`, `T`, `VD`, `VN`, and `ĐN`. Always exclude `H` and `Q`; `HN` is valid.
- Treat the `excludedDressCodes` field in `catalog-data.json` as the source of truth for dresses hidden from the public gallery. Excluded records must carry `isExcluded: true` and must not render publicly.
- For accessories, read `Tên sản phẩm`, `Giá`, `Mã`, and `Link công khai` from `accessories.csv`. The price is in thousands of đồng and must be converted to đồng. Exclude the exact uppercased codes `VA`, `VH`, and `VT`.
- Do not create a public card for a product missing a valid image URL, required price, name, or code. Report unmatched image codes and malformed accessory rows when rebuilding data.

## Page expectations

- Keep two accessible, keyboard-navigable tabs: `Váy` and `Phụ kiện`.
- Keep the category filter defaulted to `Tất cả`, with all listed categories available.
- Render image-first responsive cards. Dress cards show code, category, prices, and shoe size when applicable; accessory cards show name and rental price.
- Use exactly 20 cards per page in each tab. Keep tab/filter state when paginating and reset the dress page to 1 when the category changes.
- Keep all visible text fully accented Vietnamese. The public empty state is `Hiện chưa có mẫu để hiển thị.`
- Keep lazy-loaded images, meaningful alt text, visible active tabs, and an image-load fallback.
- Do not add checkout, stock promises, contact channels, analytics, or third-party embeds unless explicitly requested.

## Rebuild and verification

Use `scripts/build-landing-catalog-data.js` to refresh image and accessory data while retaining approved dress prices from the existing catalog:

```powershell
node .codex/skills/morina-landing-page/scripts/build-landing-catalog-data.js --output catalog-data.json
```

Pass updated excluded dress codes explicitly when needed:

```powershell
node .codex/skills/morina-landing-page/scripts/build-landing-catalog-data.js --exclude VN01,VN04,VN09 --exclude-accessories VA,VH,VT --output catalog-data.json
```

Before handing off, confirm that the catalog has no public `H` or `Q` record, excluded dresses and accessories are hidden, all public cards have required data, pagination renders 20 cards per page, and the page works at desktop and mobile widths.
