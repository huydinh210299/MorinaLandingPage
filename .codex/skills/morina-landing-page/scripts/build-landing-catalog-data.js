#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DRESS_CATEGORY_CODES = new Set(["AD", "AL", "CB", "G", "HN", "M", "N", "T", "VD", "VN", "ĐN"]);
const EXCLUDED_CATEGORY_CODES = new Set(["H", "Q"]);
const DEFAULT_EXCLUDED_ACCESSORY_CODES = new Set(["VA", "VH", "VT"]);

const readOption = (name) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === "\"" && insideQuotes && nextCharacter === "\"") {
      current += "\"";
      index += 1;
    } else if (character === "\"") {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current);
  return values;
};

const parseCsv = (content) => {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "").map((header) => header.trim());

  return lines.map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index]?.trim() || "";
      return row;
    }, {});
  });
};

const getGoogleDriveFileId = (url) => {
  return url.match(/[?&]id=([^&]+)/)?.[1] || url.match(/\/d\/([^/]+)/)?.[1] || "";
};

const toDriveThumbnail = (url) => {
  const fileId = getGoogleDriveFileId(url);
  return fileId ? "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000" : url;
};

const getProductCode = (row) => {
  const categoryCode = (row["Folder Path"] || "").split("/").pop()?.trim().toUpperCase();
  const ordinal = (row["Original Name"] || "").match(/^(\d+)/)?.[1];
  return categoryCode && ordinal ? categoryCode + String(Number(ordinal)).padStart(2, "0") : "";
};

const getDressImageUrl = (row) => {
  return toDriveThumbnail(row["Direct Image Link"] || row["View Link"] || "");
};

const getAccessoryImageUrl = (row) => {
  return toDriveThumbnail(row["Link công khai"] || "");
};

const root = process.cwd();
const imageCsvPath = path.join(root, "image_link.csv");
const accessoriesCsvPath = path.join(root, "accessories.csv");
const currentCatalogPath = path.join(root, "catalog-data.json");
const outputPath = path.resolve(root, readOption("--output") || "catalog-data.json");

if (!fs.existsSync(imageCsvPath)) throw new Error("Không tìm thấy tệp ảnh: " + imageCsvPath);
if (!fs.existsSync(accessoriesCsvPath)) throw new Error("Không tìm thấy tệp phụ kiện: " + accessoriesCsvPath);
if (!fs.existsSync(currentCatalogPath)) throw new Error("Không tìm thấy catalog hiện có: " + currentCatalogPath);

const currentCatalog = JSON.parse(fs.readFileSync(currentCatalogPath, "utf8"));
const fallbackExcludedDressCodes = Array.isArray(currentCatalog.excludedDressCodes)
  ? currentCatalog.excludedDressCodes
  : [];
const excludedDressCodes = new Set(
  (readOption("--exclude") || fallbackExcludedDressCodes.join(","))
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
);
const excludedAccessoryCodes = new Set(
  (readOption("--exclude-accessories") || [...DEFAULT_EXCLUDED_ACCESSORY_CODES].join(","))
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
);

const imageByProductCode = new Map();
for (const row of parseCsv(fs.readFileSync(imageCsvPath, "utf8"))) {
  const code = getProductCode(row);
  const imageUrl = getDressImageUrl(row);
  if (code && imageUrl) imageByProductCode.set(code, imageUrl);
}

const baseDressProducts = Array.isArray(currentCatalog.dressProducts) ? currentCatalog.dressProducts : [];
const dressProducts = baseDressProducts
  .filter((product) => DRESS_CATEGORY_CODES.has(product.categoryCode) && !EXCLUDED_CATEGORY_CODES.has(product.categoryCode))
  .map((product) => ({
    ...product,
    code: String(product.code || "").trim().toUpperCase(),
    imageUrl: imageByProductCode.get(String(product.code || "").trim().toUpperCase()) || product.imageUrl || "",
    isExcluded: excludedDressCodes.has(String(product.code || "").trim().toUpperCase())
  }));

const knownDressCodes = new Set(dressProducts.map((product) => product.code));
const unmatchedDressImageCodes = [...imageByProductCode.keys()].filter((code) => !knownDressCodes.has(code)).sort();
const unmatchedDressProductCodes = dressProducts.filter((product) => !product.imageUrl).map((product) => product.code);
const unknownExcludedDressCodes = [...excludedDressCodes].filter((code) => !knownDressCodes.has(code)).sort();

const accessoryRows = parseCsv(fs.readFileSync(accessoriesCsvPath, "utf8"));
const hasAccessoryStatus = accessoryRows.some((row) => Object.hasOwn(row, "Trạng thái"));
const accessoryCandidates = accessoryRows
  .filter((row) => !hasAccessoryStatus || row["Trạng thái"] === "Công khai")
  .map((row) => {
    const priceText = (row["Giá"] || "").trim();
    return {
      code: (row["Mã"] || "").trim().toUpperCase(),
      name: (row["Tên sản phẩm"] || row["Tên ảnh"] || "").trim(),
      priceText,
      price: Number(priceText) * 1000,
      imageUrl: getAccessoryImageUrl(row),
      sourceUrl: row["Link công khai"] || ""
    };
  });
const invalidAccessoryRows = accessoryCandidates
  .filter((item) => !item.code || !item.name || !item.priceText || !Number.isFinite(item.price) || item.price < 0 || !item.imageUrl)
  .map((item) => item.code || item.name || "(không có mã)");
const accessories = accessoryCandidates
  .filter((item) => item.code && item.name && item.priceText && Number.isFinite(item.price) && item.price >= 0 && item.imageUrl && !excludedAccessoryCodes.has(item.code))
  .map(({ code, name, price, imageUrl, sourceUrl }) => ({ code, name, price, imageUrl, sourceUrl }));

const catalog = {
  generatedAt: new Date().toISOString(),
  excludedDressCodes: [...excludedDressCodes].sort(),
  excludedAccessoryCodes: [...excludedAccessoryCodes].sort(),
  dressProducts,
  accessories,
  invalidAccessoryRows,
  unmatchedDressProductCodes,
  unmatchedDressImageCodes,
  unknownExcludedDressCodes
};

fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log("Đã tạo " + dressProducts.length + " sản phẩm và " + accessories.length + " phụ kiện tại " + outputPath + ".");
if (unmatchedDressProductCodes.length) console.warn("Váy chưa có ảnh: " + unmatchedDressProductCodes.join(", "));
if (unmatchedDressImageCodes.length) console.warn("Ảnh chưa có giá hoặc danh mục trong catalog: " + unmatchedDressImageCodes.join(", "));
if (unknownExcludedDressCodes.length) console.warn("Mã váy loại trừ không hợp lệ: " + unknownExcludedDressCodes.join(", "));
if (invalidAccessoryRows.length) console.warn("Phụ kiện thiếu dữ liệu hợp lệ: " + invalidAccessoryRows.join(", "));
