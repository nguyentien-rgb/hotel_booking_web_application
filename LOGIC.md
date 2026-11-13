# Logic của Hotel Booking Web App

## 1. Kiến trúc tổng quan

```
Frontend (HTML/CSS/JS thuần, mỗi trang 1 thư mục)
   │  fetch() → http://localhost:5273/api   (+ header Authorization: Bearer <JWT>)
   ▼
HotelBooking/  (ASP.NET Core .NET 10 + EF Core + JWT + BCrypt)
   ▼
SQL Server: bảng users, hotels, bookings
```

`backend/` (Node.js + MySQL) là backend cũ, frontend không còn dùng.

| Thư mục | Vai trò |
|---|---|
| `home/` | Trang chủ: danh sách hotel, ô tìm kiếm nhanh |
| `search/` | Tìm kiếm + lọc + sắp xếp hotel (lọc phía client) |
| `hotel-detail/` | Chi tiết 1 hotel (`?id=`) |
| `booking/` | Chọn ngày, số khách, xem tạm tính, lưu draft |
| `payment/` | Chọn phương thức thanh toán, gọi API tạo booking |
| `profile/` | Thông tin user, lịch sử booking, logout |
| `login/`, `register/` | Đăng nhập / đăng ký |
| `shared/` | Code và component dùng chung |
| `HotelBooking/` | Backend .NET |

## 2. Chạy dự án

1. Backend: trong `HotelBooking/` chạy `dotnet run --launch-profile http` → `http://localhost:5273`. Lần chạy đầu tự tạo database và dữ liệu mẫu (`DbSeeder`).
2. Frontend: serve thư mục gốc bằng một static server bất kỳ (Live Server, `npx http-server -p 5500`), mở `home/index.html`.

Tài khoản mẫu (seed):

| Email | Mật khẩu | Role |
|---|---|---|
| `admin@hotel.com` | `admin123` | admin |
| `owner1@hotel.com`, `owner2@hotel.com` | `owner123` | owner |
| `user@hotel.com` | `user123` | customer |

## 3. Module dùng chung (`shared/js`)

Mỗi file là một IIFE gắn object vào `window`:

- **`api.js` → `window.Api`**: `fetchHotels`, `fetchHotelById`, `createBooking`, `fetchMyBookings`, `loginUser`, `registerUser`. Base URL `http://localhost:5273/api`.
  - `authHeaders()` gắn `Authorization: Bearer <token>` lấy từ user đang đăng nhập.
  - `handleError()` đọc `{ message }` từ server. Nếu server trả **401** (không có token / token hết hạn) thì tự đăng xuất và báo "Your session has expired. Please login again."
- **`router.js` → `window.Router`**: chuyển trang bằng `window.location.href` (`goToHome`, `goToSearch(q)`, `goToHotelDetail(id)`, `goToBooking(id)`, `goToPayment`, `goToProfile`, `goToLogin`, `goToRegister`).
- **`utils.js` → `window.Utils`, `window.Theme`**: format giá (`vi-VN`, ₫), đọc query param, tính số đêm, lưu/đọc/xoá user hiện tại, dark mode.
- **`render.js` → `window.Render`**: `initSharedLayout()` nạp `header.html`/`footer.html`, gắn nút dark mode và nút user; `renderHotelGrid()` render danh sách hotel từ template `hotel-card.html`.
- **`data.js`**: `window.HOTELS = []` (dữ liệu giả cũ, giờ để trống).

### Các key localStorage

| Key | Nội dung | Ghi bởi |
|---|---|---|
| `hb_current_user` | `{ id, name, email, role, token }`, không có mật khẩu | login, register |
| `hb_theme` | `"dark"` / `"light"` | nút dark mode |
| `booking_draft` | Booking chưa thanh toán | booking |
| `selected_hotel_id/name/price` | Hotel đang chọn (dự phòng) | hotel-detail, booking |
| `current_user` | Key cũ, chỉ còn làm fallback | — |

Logout (`Utils.logoutCurrentUser`) xoá `hb_current_user`, tức là xoá luôn token.

## 4. Luồng người dùng

```
Home ──► Search ──► Hotel Detail ──► Booking ──► Payment ──► Profile
              (q)            (id)          (id)    (draft)     (lịch sử)
Login/Register ──► Profile
```

### 4.1 Đăng ký / Đăng nhập
1. Form kiểm tra không được để trống.
2. `Api.registerUser({ name, email, password })` hoặc `Api.loginUser({ email, password })`.
3. Thành công → server trả `{ token, user: { id, name, email, role } }` → lưu `Utils.setCurrentUser({ ...user, token })` → chuyển sang Profile.
4. Lỗi → hiện `message` từ server: mật khẩu < 6 ký tự, email sai định dạng, 409 email đã tồn tại, 401 sai email/mật khẩu, 403 tài khoản bị khoá.

Đăng ký từ frontend luôn tạo role `customer`.

### 4.2 Home
- `Api.fetchHotels()` → render grid hotel.
- Click card → `Router.goToHotelDetail(id)`; nút Book → `Router.goToBooking(id)`.
- Submit ô tìm kiếm → `Router.goToSearch(q)`.

### 4.3 Search
- Gọi `Api.fetchHotels()` một lần, lưu vào `SEARCH_HOTELS`, sinh danh sách location cho dropdown.
- Đọc `?q=` từ URL làm giá trị ban đầu của ô tên.
- `performSearch()` lọc **phía client** theo thứ tự:
  1. Tên chứa chuỗi tìm (không phân biệt hoa thường)
  2. Location (ô search-location được ưu tiên hơn filter-location, so sánh bằng)
  3. Giá `>= min`, `<= max`
  4. Rating `>=` mức chọn
  5. Sort: `price-asc`, `price-desc`, `rating-desc`
- Nút Reset xoá hết filter rồi tìm lại.

### 4.4 Hotel Detail
- Lấy `id` từ URL → `Api.fetchHotelById(id)` → hiện ảnh (click thumbnail để đổi ảnh chính), giá, rating, mô tả.
- Hotel chưa được duyệt → server trả 404.
- Nút Book: lưu `selected_hotel_*` → `Router.goToBooking(id)`.

### 4.5 Booking
- Lấy `id` từ URL → `Api.fetchHotelById`.
- Khi đổi ngày / số khách, hiện **tạm tính** (chỉ để xem, server tính lại khi đặt):
  - `nights = round((checkOut - checkIn) / 1 ngày)`
  - `total = nights × guests × price`
- Nút "Proceed to payment":
  1. Chưa đăng nhập → alert, chuyển sang Login.
  2. Kiểm tra: đủ 2 ngày, `nights > 0`, `guests >= 1`.
  3. Lưu `booking_draft = { hotelId, hotelName, location, checkIn, checkOut, guests, nights, total }`.
  4. Chuyển sang Payment. **Chưa gọi API ở bước này.**

### 4.6 Payment
1. Đọc `booking_draft`; không có thì báo lỗi. Lấy hotel theo `draft.hotelId`.
2. Chọn phương thức; nếu là thẻ thì kiểm tra: tên không trống, số thẻ 13–19 chữ số, hạn `MM/YY`, CVV 3 số.
3. `processPayment()`:
   - Giả lập chờ 1,5 giây (không có cổng thanh toán thật).
   - Chưa đăng nhập → báo lỗi, chuyển sang Login.
   - `Api.createBooking({ hotelId, checkIn, checkOut, guests, paymentMethod })`. Không gửi `userId`, `nights`, `total`.
   - Thành công → hiện mã booking, xoá `booking_draft`, sau 1,5 giây chuyển sang Profile.
   - Lỗi (ví dụ ngày check-in ở quá khứ) → hiện `Payment failed: <message>`, mở lại nút "Pay now" để thử lại.

### 4.7 Profile
- Không có user → hiện link Login/Register.
- Có user → hiện tên, email, nút Logout (→ về Home).
- `Api.fetchMyBookings()` → `GET /api/bookings` kèm token → hiện danh sách booking (tên hotel, ngày, số đêm, số khách, tổng tiền).

## 5. Backend .NET (`HotelBooking/`)

### 5.1 Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `Program.cs` | Đăng ký DbContext (SQL Server), `TokenService`, JWT, CORS; gọi `DbSeeder.Seed` khi khởi động |
| `Controllers/` | `ApiControllerBase` (đọc `CurrentUserId` từ claim `sub`, helper `Error(status, message)`), `AuthController`, `HotelsController`, `BookingsController` |
| `Models/` | `User`, `Hotel`, `Booking` + hằng số `Roles`, `HotelStatus`, `BookingStatus` |
| `Dtos/` | Request có validate (`RegisterRequest`, `LoginRequest`, `CreateBookingRequest`) và response (`UserDto`, `AuthResponse`, `HotelDto`, `BookingDto`) |
| `Data/` | `AppDbContext` (map bảng/cột snake_case, check constraint), `DbSeeder` |
| `Services/TokenService.cs` | Tạo JWT |

### 5.2 Cấu hình (`appsettings.json`)
- `ConnectionStrings:Default`: SQL Server LocalDB `(localdb)\MSSQLLocalDB`, database `hotel_booking`, đăng nhập bằng Windows.
- `Jwt`: `Key`, `Issuer`, `Audience`, `ExpiresMinutes` (120). Khi chạy môi trường Development, `Jwt:Key` trong `appsettings.Development.json` sẽ ghi đè key ở `appsettings.json`.
- CORS cho phép mọi origin (frontend tĩnh chạy ở cổng khác, không dùng cookie).

### 5.3 Xác thực và phân quyền
- **Vai trò**: `admin`, `owner`, `customer`. Đăng ký chỉ chọn được `customer` hoặc `owner`, không tự đăng ký admin.
- Mật khẩu hash bằng **BCrypt**; email được trim và chuyển chữ thường trước khi lưu/so sánh.
- JWT ký HMAC-SHA256, chứa claim `sub` (user id), `name`, `email`, `role`. `MapInboundClaims = false` để giữ nguyên tên claim, `RoleClaimType = "role"` để `[Authorize(Roles = ...)]` hoạt động.
- Server luôn lấy user id từ token, không bao giờ nhận từ frontend.
- Mọi lỗi trả dạng `{ message }`, kể cả lỗi validate (cấu hình `InvalidModelStateResponseFactory` trong `Program.cs`).

### 5.4 API

| Method | Endpoint | Quyền | Logic |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Validate, email chưa tồn tại → hash mật khẩu → 201 `{ token, user }` |
| POST | `/api/auth/login` | Public | Sai email/mật khẩu → 401; tài khoản khoá → 403; đúng → `{ token, user }` |
| GET | `/api/auth/me` | Đã đăng nhập | Thông tin user từ token |
| GET | `/api/hotels` | Public | Chỉ hotel `approved`, sắp xếp rating giảm dần; `image1`, `image2` gộp thành `images[]` |
| GET | `/api/hotels/{id}` | Public | 1 hotel `approved`, không có → 404 |
| POST | `/api/bookings` | customer | Xem 5.5 |
| GET | `/api/bookings` | customer | Booking của chính mình, mới nhất trước |
| PUT | `/api/bookings/{id}/cancel` | customer | Xem 5.5 |

Không có token → 401. Sai role (ví dụ owner gọi `/api/bookings`) → 403.

### 5.5 Quy tắc booking
- **Tạo booking**:
  - Check-in không được ở quá khứ; check-out phải sau check-in; số khách từ 1 đến 20.
  - Hotel phải tồn tại và đã `approved`.
  - Server tự tính `nights = checkOut - checkIn` và `total = price × nights × guests`, không tin số frontend gửi.
  - Trả 201 `{ success, bookingId, nights, total }`, trạng thái ban đầu `pending`.
- **Trạng thái**: `pending` → `confirmed` → `completed`, hoặc `cancelled`.
- **Huỷ**: chỉ booking của chính mình, đang `pending`/`confirmed`, và trước ngày check-in.

### 5.6 Database

| Bảng | Cột chính |
|---|---|
| `users` | `id`, `name`, `email` (unique), `password_hash`, `role`, `is_active`, `created_at` |
| `hotels` | `id`, `owner_id` → users, `name`, `location`, `price`, `rating`, `description`, `image1`, `image2`, `status`, `created_at` |
| `bookings` | `id`, `user_id` → users, `hotel_id` → hotels, `check_in`, `check_out`, `guests`, `nights`, `total`, `payment_method`, `status`, `created_at` |

Database được tạo bằng `EnsureCreated()` (chưa dùng migration), nên khi đổi model phải xoá database để tạo lại.

## 6. Hạn chế / việc còn lại

- **Chưa có chức năng cho owner/admin**: model đã có role và trạng thái duyệt hotel, nhưng chưa có API để owner thêm/sửa hotel, admin duyệt hotel hay khoá tài khoản, hay xác nhận/hoàn tất booking.
- Frontend chưa có nút huỷ booking (API đã có).
- Thanh toán chỉ là giả lập; booking tạo ra ở trạng thái `pending`.
- Token lưu trong localStorage, nên nếu trang bị lỗi XSS thì token có thể bị lấy.
- Trang booking dùng `alert()` khi chưa đăng nhập hoặc nhập thiếu.
- `booking/`, `payment/`, `search/`, `hotel-detail/` còn đoạn code cũ bị comment và khai báo hàm trùng tên; bản có hiệu lực là bản khai báo sau cùng trong file.
- `Jwt:Key` đang nằm trong file config được commit; khi deploy thật phải đổi key và để ngoài source (biến môi trường / user secrets).
