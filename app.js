const PAGE_SIZE = 20;
const IMAGE_PROXY_ORIGIN = "https://media.morina.click";
const EXCLUDED_ACCESSORY_CODES = new Set(["VA", "VH", "VT"]);
const FEATURED_DRESS_CODES = ["VD34", "AD38", "AD35", "AD40", "VD82"];
const CATEGORIES = [
  { code: "ALL", name: "Tất cả" },
  { code: "AD", name: "Áo dài - Áo yếm" },
  { code: "AL", name: "Áo lụa" },
  { code: "CB", name: "Chấm bi" },
  { code: "G", name: "Giày" },
  { code: "HN", name: "Hoa nhí" },
  { code: "M", name: "Mũ" },
  { code: "N", name: "Nón" },
  { code: "T", name: "Túi" },
  { code: "VD", name: "Váy dài" },
  { code: "VN", name: "Váy ngắn" },
  { code: "ĐN", name: "Váy đen ngắn" }
];

const state = { tab: "dress", category: "ALL", page: { dress: 1, accessories: 1 }, catalog: null };
const money = new Intl.NumberFormat("vi-VN");
const grid = document.querySelector("#catalog-grid");
const count = document.querySelector("#catalog-count");
const pageLabel = document.querySelector("#catalog-page-label");
const pagination = document.querySelector("#pagination");
const categorySelect = document.querySelector("#category-select");
const tabs = [...document.querySelectorAll("[role=tab]")];
const imageModal = document.querySelector("#image-modal");
const modalImage = document.querySelector("#image-modal-image");
const modalTitle = document.querySelector("#image-modal-title");
const modalClose = document.querySelector("#image-modal-close");
const featuredCarouselTrack = document.querySelector("#featured-carousel-track");

const getCachedImageUrl = (imageUrl) => {
  if (!imageUrl) return imageUrl;

  try {
    const sourceUrl = new URL(imageUrl);
    if (sourceUrl.hostname !== "drive.google.com" || sourceUrl.pathname !== "/thumbnail") {
      return imageUrl;
    }

    const fileId = sourceUrl.searchParams.get("id");
    const requestedSize = sourceUrl.searchParams.get("sz") || "w1000";
    const size = /^w[1-9]\d{1,3}$/.test(requestedSize) ? requestedSize : "w1000";

    if (!fileId || !/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) return imageUrl;

    return `${IMAGE_PROXY_ORIGIN}/img/${fileId}?sz=${size}`;
  } catch {
    return imageUrl;
  }
};

const useCachedImageUrls = (catalog) => ({
  ...catalog,
  dressProducts: catalog.dressProducts.map((product) => ({
    ...product,
    imageUrl: getCachedImageUrl(product.imageUrl)
  })),
  accessories: catalog.accessories.map((accessory) => ({
    ...accessory,
    imageUrl: getCachedImageUrl(accessory.imageUrl)
  }))
});

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const getShoeSizeByCode = (content) => {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "").map((header) => header.trim());
  const shoeSizeByCode = new Map();

  for (const line of lines) {
    const values = parseCsvLine(line);
    const row = headers.reduce((result, header, index) => {
      result[header] = values[index]?.trim() || "";
      return result;
    }, {});
    const productCode = (row.ma || "").toUpperCase();

    if (row.phan_loai === "G" && productCode && row.size) {
      shoeSizeByCode.set(productCode, row.size);
    }
  }

  return shoeSizeByCode;
};

const applyShoeSizes = (catalog, shoeSizeByCode) => ({
  ...catalog,
  dressProducts: catalog.dressProducts.map((product) => ({
    ...product,
    size: product.categoryCode === "G" ? shoeSizeByCode.get(product.code) || "" : ""
  }))
});

const createButton = (label, onClick, options = {}) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.disabled = Boolean(options.disabled);
  button.className = options.className || "";
  button.setAttribute("aria-label", options.ariaLabel || label);
  button.addEventListener("click", onClick);
  return button;
};

const openImageModal = (imageUrl, label) => {
  modalImage.src = imageUrl;
  modalImage.alt = label;
  modalTitle.textContent = label;
  imageModal.showModal();
};

const closeImageModal = () => {
  imageModal.close();
};

const imageWithFallback = (item, label) => {
  const wrapper = document.createElement("button");
  wrapper.type = "button";
  wrapper.className = "image-wrap";
  wrapper.setAttribute("aria-label", `Xem ảnh lớn ${label}`);
  wrapper.addEventListener("click", () => openImageModal(item.imageUrl, label));

  const image = document.createElement("img");
  image.src = item.imageUrl;
  image.alt = label;
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "image-fallback";
    fallback.textContent = "Không tải được ảnh";
    image.replaceWith(fallback);
  }, { once: true });
  wrapper.append(image);
  return wrapper;
};

const createFeaturedCard = (product, index) => {
  const card = document.createElement("article");
  card.className = `featured-card featured-card--${index}`;
  card.setAttribute("role", "listitem");

  const image = document.createElement("img");
  image.src = product.imageUrl;
  image.alt = `Mẫu ${product.code}`;
  image.loading = "eager";
  image.referrerPolicy = "no-referrer";
  card.append(image);
  return card;
};

const renderFeaturedCarousel = () => {
  const productsByCode = new Map(state.catalog.dressProducts.map((product) => [product.code, product]));
  const featuredProducts = FEATURED_DRESS_CODES.map((code) => productsByCode.get(code)).filter((product) => product && product.imageUrl && !product.isExcluded);
  featuredCarouselTrack.replaceChildren(...featuredProducts.map(createFeaturedCard));
};

const createDressCard = (product) => {
  const card = document.createElement("article");
  card.className = "product-card";
  card.append(imageWithFallback(product, `Mẫu ${product.code}`));

  const body = document.createElement("div");
  body.className = "card-body";
  const category = document.createElement("span");
  category.className = "card-category";
  category.textContent = product.categoryName;
  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = `Mã ${product.code}`;
  const details = document.createElement("div");
  details.className = "card-details";
  const sixHourPrice = document.createElement("strong");
  sixHourPrice.textContent = `6 giờ: ${money.format(product.sixHPrice)}đ`;
  const fullDayPrice = document.createElement("span");
  fullDayPrice.textContent = `1 ngày: ${money.format(product.fullDayPrice)}đ`;
  details.append(sixHourPrice, fullDayPrice);
  if (product.categoryCode === "G") {
    const size = document.createElement("span");
    size.textContent = `Kích cỡ: ${product.size || "Chưa cập nhật"}`;
    details.append(size);
  }
  body.append(category, title, details);
  card.append(body);
  return card;
};

const createAccessoryCard = (accessory) => {
  const card = document.createElement("article");
  card.className = "product-card";
  card.append(imageWithFallback(accessory, accessory.name));
  const body = document.createElement("div");
  body.className = "card-body";
  const category = document.createElement("span");
  category.className = "card-category";
  category.textContent = "Phụ kiện";
  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = accessory.name;
  const details = document.createElement("div");
  details.className = "card-details";
  details.innerHTML = `<strong>Giá thuê: ${money.format(accessory.price)}đ</strong>`;
  body.append(category, title, details);
  card.append(body);
  return card;
};

const getVisibleItems = () => {
  if (state.tab === "accessories") return state.catalog.accessories.filter((item) => item.code && item.name && Number.isFinite(item.price) && item.price >= 0 && item.imageUrl && !EXCLUDED_ACCESSORY_CODES.has(item.code));
  return state.catalog.dressProducts.filter((item) => !item.isExcluded && item.imageUrl && (state.category === "ALL" || item.categoryCode === state.category));
};

const renderCategories = () => {
  categorySelect.replaceChildren();
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.code;
    option.textContent = category.name;
    categorySelect.append(option);
  });
  categorySelect.value = state.category;
};

const pageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const middle = [current - 1, current, current + 1].filter((page) => page > 1 && page < total);
  return [1, ...(middle[0] > 2 ? ["…"] : []), ...middle, ...(middle.at(-1) < total - 1 ? ["…"] : []), total];
};

const renderPagination = (total, currentPage) => {
  pagination.replaceChildren();
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;
  pagination.append(createButton("Trước", () => { state.page[state.tab] -= 1; render(); }, { disabled: currentPage === 1, ariaLabel: "Trang trước" }));
  pageNumbers(currentPage, totalPages).forEach((entry) => {
    if (entry === "…") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = entry;
      pagination.append(ellipsis);
    } else {
      pagination.append(createButton(String(entry), () => { state.page[state.tab] = entry; render(); }, { className: entry === currentPage ? "is-active" : "", ariaLabel: `Trang ${entry}` }));
    }
  });
  pagination.append(createButton("Sau", () => { state.page[state.tab] += 1; render(); }, { disabled: currentPage === totalPages, ariaLabel: "Trang sau" }));
};

const render = () => {
  const visibleItems = getVisibleItems();
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const activePage = Math.min(state.page[state.tab], totalPages);
  state.page[state.tab] = activePage;
  const items = visibleItems.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  document.querySelector("#dress-panel").hidden = state.tab !== "dress";
  document.querySelector("#accessory-panel").hidden = state.tab !== "accessories";
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === state.tab;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  grid.replaceChildren();
  if (!items.length) grid.append(document.querySelector("#empty-state-template").content.cloneNode(true));
  items.forEach((item) => grid.append(state.tab === "dress" ? createDressCard(item) : createAccessoryCard(item)));
  const noun = state.tab === "dress" ? "mẫu" : "phụ kiện";
  count.textContent = `${visibleItems.length} ${noun} đang hiển thị`;
  pageLabel.textContent = visibleItems.length > PAGE_SIZE ? `Trang ${activePage} / ${totalPages}` : "";
  renderPagination(visibleItems.length, activePage);
  renderCategories();
};

const activateTab = (tab) => {
  state.tab = tab;
  render();
};

categorySelect.addEventListener("change", () => {
  state.category = categorySelect.value;
  state.page.dress = 1;
  render();
});

modalClose.addEventListener("click", closeImageModal);
imageModal.addEventListener("click", (event) => {
  if (event.target === imageModal) closeImageModal();
});
imageModal.addEventListener("close", () => {
  modalImage.removeAttribute("src");
});

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex].focus();
    activateTab(tabs[nextIndex].dataset.tab);
  });
});

Promise.all([
  fetch("./catalog-data.json").then((response) => {
    if (!response.ok) throw new Error("Không thể tải danh mục.");
    return response.json();
  }),
  fetch("./size.csv")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải kích cỡ.");
      return response.text();
    })
    .then(getShoeSizeByCode)
    .catch(() => new Map())
])
  .then(([catalog, shoeSizeByCode]) => {
    state.catalog = useCachedImageUrls(applyShoeSizes(catalog, shoeSizeByCode));
    renderFeaturedCarousel();
    render();
  })
  .catch(() => {
    count.textContent = "Không thể tải danh mục. Vui lòng thử lại sau.";
    grid.replaceChildren();
    grid.append(document.querySelector("#empty-state-template").content.cloneNode(true));
  });
