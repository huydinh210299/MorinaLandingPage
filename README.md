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

- Hình sản phẩm hiện dùng các URL ngoài. Kiểm tra quyền truy cập công khai của ảnh trước khi phát hành.
- Sau lần triển khai đầu tiên, có thể gắn tên miền riêng trong Cloudflare Pages rồi cấu hình DNS theo hướng dẫn Cloudflare.
