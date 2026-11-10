# Morina Landing Page

Trang landing page dành cho khách hàng của Morina, dùng để xem danh mục sản phẩm và thông tin liên quan. Đây là website tĩnh, không có trang quản trị, máy chủ ứng dụng hoặc cơ sở dữ liệu.

Không cần cài đặt phụ thuộc hay bước dựng: các tệp `index.html`, `styles.css`, `app.js` và `catalog-data.json` được triển khai trực tiếp.

## Chạy trên máy

Mở thư mục này bằng một máy chủ tĩnh. Ví dụ, với Node.js:

```powershell
npx serve .
```

Không mở `index.html` trực tiếp bằng trình duyệt vì trình duyệt có thể chặn việc tải `catalog-data.json` qua `file://`.

## Triển khai Cloudflare Pages qua GitHub

1. Đẩy thư mục này lên một kho GitHub. Tệp `index.html` phải nằm ở thư mục gốc của kho.
2. Trong Cloudflare, vào **Workers & Pages** → **Create application** → **Pages** → **Import an existing Git repository**.
3. Kết nối GitHub, chọn kho chứa landing page, rồi dùng các thiết lập sau:
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** `exit 0`
   - **Build output directory:** `.`
   - **Root directory:** để trống
4. Chọn **Save and Deploy**. Cloudflare sẽ cấp một địa chỉ `*.pages.dev` sau khi triển khai thành công.

Mỗi lần đẩy thay đổi lên nhánh `main`, Cloudflare Pages sẽ tự động triển khai phiên bản mới. Các nhánh khác có thể tạo bản xem trước trước khi phát hành chính thức.

## Lưu ý

- Mục Morina Lens dùng ảnh cục bộ `assets/morina-lens-dreammoon.png` do chủ shop cung cấp và nút liên kết trực tiếp đến shop `morina.store`, giữ nguyên các tham số trong URL Shopee đã cung cấp. Liên kết HTTPS cho phép hệ điều hành mở app Shopee khi đã cài và cho phép mở liên kết; nếu không, shop mở trên trình duyệt. Cần kiểm tra việc chuyển sang app trên điện thoại thật vì phụ thuộc cài đặt hệ điều hành và trình duyệt.
- Hình sản phẩm hiện dùng các URL ngoài. Kiểm tra quyền truy cập công khai của ảnh trước khi phát hành.
- Sau lần triển khai đầu tiên, có thể gắn tên miền riêng trong Cloudflare Pages rồi cấu hình DNS theo hướng dẫn Cloudflare.

## SEO

- URL chính thức: `https://customer.morina.click/`. Canonical, Open Graph, dữ liệu có cấu trúc và sitemap dùng cùng URL này.
- Triển khai cả `robots.txt` và `sitemap.xml` ở thư mục gốc cùng `index.html`.
- Sau khi triển khai, xác minh website trong Google Search Console và gửi `https://customer.morina.click/sitemap.xml`; dùng Kiểm tra URL để kiểm tra trang đã xuất bản.
- Khi đổi tên miền hoặc thông tin liên hệ, cập nhật đồng bộ metadata, JSON-LD, robots.txt và sitemap.xml.
- Danh mục vẫn được tải bằng JavaScript từ `catalog-data.json`; chưa có trang riêng cho từng sản phẩm.
