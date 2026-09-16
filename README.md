# Morina Landing Page

Trang danh mục tĩnh của Morina. Không cần cài đặt phụ thuộc hay bước dựng: các tệp `index.html`, `styles.css`, `app.js` và `catalog-data.json` được triển khai trực tiếp.

## Chạy trên máy

Mở thư mục này bằng một máy chủ tĩnh. Ví dụ, với Node.js:

```powershell
npx serve .
```

Không mở `index.html` trực tiếp bằng trình duyệt vì trình duyệt có thể chặn việc tải `catalog-data.json` qua `file://`.

## Triển khai Cloudflare Pages bằng GitHub Actions

1. Tạo dự án **Cloudflare Pages Direct Upload** một lần và đặt nhánh phát hành là `main`:

   ```powershell
   npx wrangler login
   npx wrangler pages project create <ten-du-an> --production-branch=main
   ```

   Khi dùng workflow này, không kết nối kho GitHub trong giao diện Pages; GitHub Actions sẽ tải tệp tĩnh lên. Cloudflare không cho chuyển một dự án Direct Upload sang Git integration sau này, nhưng GitHub Actions vẫn là quy trình triển khai tự động của kho này.
2. Tạo API token Cloudflare có quyền **Account → Cloudflare Pages → Edit** cho đúng tài khoản. Không dùng Global API Key.
3. Trong kho GitHub, vào **Settings → Secrets and variables → Actions** và thêm:
   - Secret `CLOUDFLARE_API_TOKEN`: API token vừa tạo.
   - Secret `CLOUDFLARE_ACCOUNT_ID`: mã Account ID trong Cloudflare dashboard.
   - Variable `CLOUDFLARE_PAGES_PROJECT`: tên dự án Pages đã tạo.
4. Đẩy nhánh `main`. Workflow `.github/workflows/deploy-cloudflare-pages.yml` sẽ triển khai thư mục gốc của kho và hiển thị URL ở phần chạy workflow.

Tệp workflow chỉ triển khai `main`, do đó một pull request không thể vô tình phát hành lên trang chính thức. Nếu cần bản xem trước cho các nhánh nội bộ, thêm một workflow riêng chạy khi đẩy nhánh và truyền tên nhánh cho `wrangler pages deploy`; không cấp API token cho pull request từ fork.

## Lưu ý vận hành

- Không lưu token, Account ID hay tệp `.dev.vars` vào Git.
- Hình sản phẩm hiện dùng các URL ngoài. Kiểm tra quyền truy cập công khai của ảnh trước khi phát hành.
- Sau lần triển khai đầu tiên, có thể gắn tên miền riêng trong Cloudflare Pages rồi cấu hình DNS theo hướng dẫn Cloudflare.
