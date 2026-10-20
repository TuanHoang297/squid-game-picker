# 🦑 Squid Game Học Đường — Đấu Trường Khảo Bài Sinh Tồn

Ứng dụng web chọn ngẫu nhiên học sinh lên bảng khảo bài / trả lời câu hỏi kịch tính và hào hứng, lấy cảm hứng từ trò chơi **"Đèn Xanh, Đèn Đỏ"** trong bộ phim đình đám **Squid Game (Trò Chơi Con Mực)**.

---

## ✨ Tính Năng Nổi Bật

- 🎯 **Luật chơi Đèn Xanh - Đèn Đỏ kịch tính**:
  - **Đèn Xanh**: Búp Bê quay lưng vào cây hát khúc ca *"Mugunghwa kkochi pieot-seumnida"*, học sinh chạy về phía trước.
  - **Đèn Đỏ**: Búp Bê quay ngoắt lại, mắt rực đỏ quét tìm mục tiêu. Cơ chế troll "đau tim" (fake-out target) giật thót tim cả lớp trước khi khóa mục tiêu thật!
  - **Bắn tỉa loại trừ**: Hiệu ứng lính áo đỏ giương súng bắn tỉa nổ tung vệt đạn kèm rung màn hình cinematic.
- 🔊 **Âm thanh chuẩn nguyên tác phim**:
  - Giọng hát Búp Bê kinh điển: *"Mugunghwa kkochi pieot-seumnida"* (무궁화 꽃이 피었습니다).
  - Tiếng súng bắn tỉa uy lực chân thực.
- 📋 **Quản lý danh sách học sinh chuyên nghiệp**:
  - Đọc trực tiếp dữ liệu từ file Excel sổ điểm học kỳ (`.xlsx`).
  - Hỗ trợ đổi lớp nhanh chóng qua thanh chọn lớp.
  - Tự động ghi nhớ học sinh đã khảo bài, không bị gọi trùng lặp trong buổi học.
  - Thêm, sửa, xóa học sinh trực tiếp trên giao diện và sao lưu dữ liệu ra file JSON.
- 💻 **Tối ưu hiển thị cho lớp học**:
  - Hỗ trợ chế độ Toàn màn hình (Fullscreen F11) cho máy chiếu và màn hình tương tác.
  - Đồ họa Canvas 60 FPS mượt mà, giao diện Dark Theme phong cách phim Squid Game.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism, Animations), Vanilla JavaScript (ES Modules).
- **Đồ họa**: HTML5 Canvas Rendering 60 FPS.
- **Xử lý Excel**: Thư viện [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs).
- **Hiệu ứng**: [canvas-confetti](https://github.com/catdad/canvas-confetti).
- **Công cụ build**: [Vite](https://vitejs.dev/).
- **Nền tảng triển khai**: Tối ưu 100% cho [Vercel](https://vercel.com).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

1. **Clone repository về máy**:
   ```bash
   git clone https://github.com/TuanHoang297/squid-game-picker.git
   cd squid-game-picker
   ```

2. **Cài đặt các thư viện phụ thuộc**:
   ```bash
   npm install
   ```

3. **Khởi chạy máy chủ phát triển (Dev Server)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt truy cập: `http://localhost:5173/`

4. **Đóng gói sản phẩm (Build Production)**:
   ```bash
   npm run build
   ```

---

## 🌐 Triển Khai Lên Vercel (1-Click Deploy)

Dự án đã được cấu hình tương thích hoàn toàn với Vercel:
1. Đăng nhập [Vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **"Add New..."** ➔ Chọn **"Project"**.
3. Chọn repo `TuanHoang297/squid-game-picker` và bấm **"Import"**.
4. Vercel tự động cấu hình:
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
5. Bấm **"Deploy"** và nhận link web online sử dụng ngay lập tức!

---

## 🎮 Cách Chơi

1. Chọn lớp học cần khảo bài trên thanh điều khiển.
2. Bấm nút **⚡ BẮT ĐẦU VÒNG QUAY** (hoặc nhấn phím cách **Space** trên bàn phím).
3. Búp bê quay lưng hát bài hát Đèn Xanh Đèn Đỏ, học sinh chạy đua.
4. Khi dứt tiếng hát, búp bê quay lại quét laser tìm người nhúc nhích.
5. Học sinh bị bắn hạ sẽ hiển thị bảng vinh danh kèm số báo danh để lên bảng trả lời bài!

---

*Phát triển với ❤️ phục vụ hoạt động dạy và học sinh động, hào hứng trong lớp học.*
