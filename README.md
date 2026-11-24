# 🏝️ Sky Sanctuary - Thế Giới Ảo 3D Metaverse (Three.js)

Thế giới ảo 3D phong cách **Đảo Bay Huyền Ảo (Sky Sanctuary)** được xây dựng hoàn toàn bằng **Three.js** và công nghệ Web tiêu chuẩn, tối ưu hóa để chạy mượt mà ngay trên mọi trình duyệt mà không cần cài đặt phần mềm phụ trợ.

---

## 🎮 Cách chạy thử nghiệm trên máy tính cá nhân (Local)

Có 2 cách rất đơn giản để chạy thử:

### Cách 1: Chạy nhanh bằng 1 cú nhấp chuột (Khuyên dùng)
* Nhấp đúp chuột vào file **`start.bat`** (hoặc chuột phải vào file `index.html` và chọn **Open with** -> **Google Chrome** / **Microsoft Edge** / **Cốc Cốc**).
* Trình duyệt sẽ mở ra thế giới 3D ngay lập tức!

### Cách 2: Chạy qua VS Code Live Server (nếu dùng VS Code)
1. Mở thư mục `sky-metaverse` trong VS Code.
2. Cài đặt tiện ích mở rộng **Live Server** (của Ritwick Dey).
3. Nhấp chuột phải vào `index.html` -> Chọn **Open with Live Server**.

---

## 🕹️ Bảng điều khiển & Phím tắt

| Phím | Thao tác |
| :--- | :--- |
| **Chuột** | Di chuyển chuột để xoay góc nhìn 360° |
| **W, A, S, D** | Di chuyển (Tiến, Lùi, Trái, Phải) |
| **Shift (Giữ)** | Chạy nhanh (Sprint) |
| **Space** | Nhảy lên |
| **Phím E** | Tương tác với đồ vật gần tầm mắt (Nhặt tinh thể, đọc bia ký, đánh phím đá) |
| **Phím ESC** | Tạm dừng và mở khóa con trỏ chuột |
| **Nút 🔊 / Bật Nhạc** | Bật / tắt nhạc nền ambient không gian |

---

## ✨ Các tính năng nổi bật trong Metaverse này

1. **Quần đảo bay huyền ảo (Floating Archipelago):**
   * **Quảng trường Thánh Điện (Main Sanctuary):** Đảo chính với thảm cỏ xanh, các cột đá cổ kính, cây cối phong cách Ghibli và Bia Ký Cổ Xưa.
   * **Đảo Đại Tinh Thể (Astral Crystal Island):** Nối bằng chuỗi bậc đá lơ lửng, chứa khối pha lê tím khổng lồ phát quang xoay đều trên không trung.
   * **Đảo Cổng Thời Không (Mystic Portal Island):** Chứa cổng vòm đá phát sáng với vòng xoáy năng lượng dịch chuyển.
   * **Đài Quan Sát Thượng Giới (Sky Spire):** Tầng quan sát trên đỉnh mây, nhìn bao quát toàn bộ quần đảo.
   * **Vườn Đá Âm Nhạc (Resonance Stones):** 5 phiến đá phát sáng tương ứng 5 nốt nhạc ngũ cung (Đô, Rê, Mi, Sol, La) phát ra âm thanh chime bằng Web Audio API khi bước lên hoặc nhấn `E`.

2. **Cơ chế vật lý & Rơi tự do:**
   * Di chuyển mượt mà có quán tính và ma sát.
   * Trọng lực tự nhiên. Nếu nhảy hoặc sẩy chân rơi khỏi đảo mây vào vực thẳm, hệ thống sẽ tự động kích hoạt **Hồi sinh (Respawn)** an toàn trở lại quảng trường chính.

3. **Hệ thống Nhiệm vụ (Quest Tracker):**
   * Nhiệm vụ thám hiểm: Thu thập **4 Mảnh Tinh Thể Ánh Sáng** nằm rải rác trên các đảo để nhận thông điệp chúc mừng.

4. **Hệ thống âm thanh Web Audio:**
   * 100% âm thanh được tổng hợp tự động qua code JavaScript (tiếng bước chân, tiếng nhặt ngọc, tiếng cổng không gian, tiếng đàn ngũ cung, nhạc nền ambient), không phụ thuộc vào file nhạc tải ngoài.

---

## 🚀 Hướng dẫn đưa lên GitHub & Xuất bản miễn phí lên Cloudflare Pages

Sau khi trải nghiệm hài lòng trên máy, các bước xuất bản lên mạng toàn cầu như sau:

### Bước 1: Đưa mã nguồn lên GitHub
1. Đăng nhập vào [GitHub](https://github.com) và tạo một repository mới (ví dụ đặt tên là `sky-metaverse`).
2. Tải toàn bộ các file trong thư mục này (`index.html`, `main.js`, `style.css`, `README.md`) lên repository đó (có thể dùng giao diện web **Add file** -> **Upload files** hoặc dùng lệnh `git push`).

### Bước 2: Kết nối Cloudflare Pages (Miễn phí 100%)
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Vào mục **Workers & Pages** -> Chọn **Create application** -> Tab **Pages** -> **Connect to Git**.
3. Chọn tài khoản GitHub của bạn và chọn repository `sky-metaverse`.
4. Cấu hình cài đặt triển khai (Build settings):
   * **Framework preset**: Chọn `None` (vì đây là trang web tĩnh thuần Three.js).
   * **Build command**: Để trống (không cần).
   * **Build output directory**: Để `/` (hoặc để trống).
5. Nhấn **Save and Deploy**.
6. Chỉ sau khoảng 15–30 giây, Cloudflare sẽ cấp cho bạn một đường link miễn phí toàn cầu có dạng:
   👉 `https://sky-metaverse.pages.dev`
