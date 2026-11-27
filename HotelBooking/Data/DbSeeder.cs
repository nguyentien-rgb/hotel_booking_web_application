using HotelBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Data;

public static class DbSeeder
{
    private const string Img = "../shared/images/hotels/";

    // Danh sách khách sạn mẫu. Ảnh lưu sẵn trong project (shared/images/hotels),
    // đường dẫn tính từ các trang frontend (mọi trang đều nằm sâu 1 cấp thư mục).
    private record SeedHotel(
        string OwnerEmail, string Name, string Location, decimal Price, decimal Rating,
        string Description, string? Image1, string? Image2, string Status);

    private static readonly SeedHotel[] Hotels =
    {
        new("owner1@hotel.com", "Khách sạn Hạ Long Bay View", "Hạ Long, Quảng Ninh", 1200000, 4.7m,
            "Khách sạn view vịnh, gần bãi tắm Bãi Cháy.",
            Img + "halong-room-2.jpg", Img + "halong-building.jpg", HotelStatus.Approved),

        new("owner.ninhbinh@hotel.com", "Ninh Binh Riverside Homestay", "Tam Cốc, Ninh Bình", 650000, 4.6m,
            "Homestay ven sông giữa núi đá vôi, gần Tràng An và Tam Cốc.",
            Img + "ninhbinh-resort.jpg", Img + "ninhbinh-room-2.jpg", HotelStatus.Approved),

        new("owner.hanoi@hotel.com", "Hanoi Old Quarter Hotel", "Hoàn Kiếm, Hà Nội", 850000, 4.5m,
            "Nằm giữa phố cổ, đi bộ ra Hồ Gươm 5 phút.",
            null, null, HotelStatus.Approved),

        new("owner2@hotel.com", "Sapa Mountain Lodge", "Sa Pa, Lào Cai", 950000, 4.6m,
            "Phòng nhìn ra thung lũng Mường Hoa.",
            Img + "sapa-room-cloud.jpg", Img + "sapa-room-balcony.jpg", HotelStatus.Approved),

        new("owner.hagiang@hotel.com", "Ha Giang Valley Homestay", "Đồng Văn, Hà Giang", 550000, 4.5m,
            "Homestay giữa thung lũng, gần đèo Mã Pì Lèng và cột cờ Lũng Cú.",
            Img + "hagiang-homestay.jpg", Img + "hagiang-room-window.jpg", HotelStatus.Approved),

        new("owner.laocai@hotel.com", "Lao Cai City Hotel", "TP. Lào Cai, Lào Cai", 700000, 4.4m,
            "Khách sạn trung tâm thành phố, gần cửa khẩu Lào Cai và ga tàu đi Sa Pa.",
            Img + "laocai-room-view.jpg", Img + "laocai-room-twin.jpg", HotelStatus.Approved),

        new("owner.phutho@hotel.com", "Long Coc Tea Hill Homestay", "Tân Sơn, Phú Thọ", 500000, 4.6m,
            "Nhà tre giữa đồi chè Long Cốc, ngắm bình minh và săn mây trên những đồi chè.",
            Img + "phutho-bamboo-homestay.jpg", Img + "phutho-tea-hills.jpg", HotelStatus.Approved),

        new("owner.mucangchai@hotel.com", "Mu Cang Chai Terrace Homestay", "Mù Cang Chải, Yên Bái", 600000, 4.7m,
            "Homestay trên sườn núi nhìn ra ruộng bậc thang, đẹp nhất mùa lúa chín tháng 9-10.",
            Img + "mcc-terraces.jpg", Img + "mcc-room.jpg", HotelStatus.Approved),

        new("owner.danang@hotel.com", "Đà Nẵng Beach Resort", "Sơn Trà, Đà Nẵng", 1800000, 4.8m,
            "Resort sát biển Mỹ Khê, có hồ bơi.",
            null, null, HotelStatus.Pending),
    };

    // Mỗi khách sạn mẫu có đúng 1 chủ riêng (mật khẩu chung: owner123)
    private static readonly (string Email, string Name)[] Owners =
    {
        ("owner1@hotel.com", "Chủ khách sạn A"),
        ("owner2@hotel.com", "Chủ khách sạn B"),
        ("owner.ninhbinh@hotel.com", "Chủ Ninh Binh Riverside"),
        ("owner.hanoi@hotel.com", "Chủ Hanoi Old Quarter"),
        ("owner.hagiang@hotel.com", "Chủ Ha Giang Valley"),
        ("owner.laocai@hotel.com", "Chủ Lao Cai City Hotel"),
        ("owner.phutho@hotel.com", "Chủ Long Coc Tea Hill"),
        ("owner.mucangchai@hotel.com", "Chủ Mu Cang Chai Terrace"),
        ("owner.danang@hotel.com", "Chủ Đà Nẵng Beach Resort"),
    };

    public static void Seed(AppDbContext db)
    {
        db.Database.EnsureCreated();
        EnsureSchema(db);
        SeedUsers(db);
        SyncOwners(db);
        SyncSamplePhones(db);
        SyncHotels(db);
    }

    // EnsureCreated chỉ tạo bảng khi database chưa tồn tại, không sửa bảng cũ.
    // Với database tạo từ phiên bản trước, tự bổ sung phần còn thiếu:
    //  - bảng owner_profiles
    //  - cột users.phone (số điện thoại của mọi người dùng)
    //  - chuyển owner_profiles.phone cũ sang users.phone rồi bỏ cột cũ
    private static void EnsureSchema(AppDbContext db)
    {
        db.Database.ExecuteSqlRaw(@"
IF OBJECT_ID(N'dbo.owner_profiles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.owner_profiles (
        user_id INT NOT NULL PRIMARY KEY,
        business_name NVARCHAR(200) NULL,
        tax_code NVARCHAR(20) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_owner_profiles_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END

IF COL_LENGTH(N'dbo.users', N'phone') IS NULL
    ALTER TABLE dbo.users ADD phone NVARCHAR(20) NULL;

-- Mỗi owner 1 khách sạn: đổi index thường của EF thành unique.
-- Bỏ qua nếu dữ liệu cũ đã có owner 2 khách sạn, để API vẫn khởi động được (controller vẫn chặn khi tạo mới).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_hotels_owner_id' AND object_id = OBJECT_ID(N'dbo.hotels') AND is_unique = 1)
   AND NOT EXISTS (SELECT owner_id FROM dbo.hotels GROUP BY owner_id HAVING COUNT(*) > 1)
BEGIN
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_hotels_owner_id' AND object_id = OBJECT_ID(N'dbo.hotels'))
        DROP INDEX IX_hotels_owner_id ON dbo.hotels;
    CREATE UNIQUE INDEX IX_hotels_owner_id ON dbo.hotels(owner_id);
END");

        // Tách thành lệnh riêng: SQL Server kiểm tra tên cột lúc biên dịch cả khối lệnh
        db.Database.ExecuteSqlRaw(@"
IF COL_LENGTH(N'dbo.owner_profiles', N'phone') IS NOT NULL
BEGIN
    EXEC(N'UPDATE u SET u.phone = p.phone FROM dbo.users u JOIN dbo.owner_profiles p ON p.user_id = u.id WHERE u.phone IS NULL');
    EXEC(N'ALTER TABLE dbo.owner_profiles DROP COLUMN phone');
END");
    }

    // Tạo tài khoản owner mẫu còn thiếu và hồ sơ chủ khách sạn mẫu (chạy cả với database cũ)
    private static void SyncOwners(AppDbContext db)
    {
        foreach (var (email, name) in Owners)
        {
            if (!db.Users.Any(u => u.Email == email))
                db.Users.Add(NewUser(name, email, "owner123", Roles.Owner));
        }
        db.SaveChanges();

        var i = 0;
        foreach (var (email, _) in Owners)
        {
            i++;
            var owner = db.Users.First(u => u.Email == email);
            if (db.OwnerProfiles.Any(p => p.UserId == owner.Id)) continue;

            var hotelName = Hotels.FirstOrDefault(h => h.OwnerEmail == email)?.Name;
            db.OwnerProfiles.Add(new OwnerProfile { UserId = owner.Id, BusinessName = hotelName });
        }
        db.SaveChanges();
    }

    // Gán số điện thoại mẫu (số giả) cho tài khoản mẫu nào chưa có
    private static void SyncSamplePhones(AppDbContext db)
    {
        var emails = new[] { "admin@hotel.com", "user@hotel.com" }.Concat(Owners.Select(o => o.Email)).ToArray();
        for (var i = 0; i < emails.Length; i++)
        {
            var user = db.Users.FirstOrDefault(u => u.Email == emails[i]);
            if (user != null && string.IsNullOrEmpty(user.Phone))
                user.Phone = "09" + (12345600 + i).ToString();
        }
        db.SaveChanges();
    }

    // Chỉ tạo tài khoản mẫu khi database còn trống
    private static void SeedUsers(AppDbContext db)
    {
        if (db.Users.Any()) return;

        db.Users.AddRange(
            NewUser("Quản trị viên", "admin@hotel.com", "admin123", Roles.Admin),
            NewUser("Khách hàng mẫu", "user@hotel.com", "user123", Roles.Customer));
        db.SaveChanges();
    }

    // Chạy mỗi lần khởi động API:
    // - khách sạn mẫu nào chưa có thì thêm
    // - khách sạn mẫu còn dùng ảnh ngoài (picsum) hoặc trống ảnh thì đổi sang ảnh trong project
    // Không đụng tới trạng thái, giá... mà owner/admin đã sửa.
    private static void SyncHotels(AppDbContext db)
    {
        foreach (var s in Hotels)
        {
            var hotel = db.Hotels.FirstOrDefault(h => h.Name == s.Name);

            if (hotel == null)
            {
                var owner = db.Users.FirstOrDefault(u => u.Email == s.OwnerEmail);
                // Owner đã có khách sạn (có thể đã đổi tên) thì không thêm bản mẫu nữa
                if (owner == null || db.Hotels.Any(h => h.OwnerId == owner.Id)) continue;

                db.Hotels.Add(new Hotel
                {
                    OwnerId = owner.Id,
                    Name = s.Name,
                    Location = s.Location,
                    Price = s.Price,
                    Rating = s.Rating,
                    Description = s.Description,
                    Image1 = s.Image1 ?? Picsum(s.Name, "a"),
                    Image2 = s.Image2 ?? Picsum(s.Name, "b"),
                    Status = s.Status
                });
            }
            else
            {
                if (s.Image1 != null && (string.IsNullOrEmpty(hotel.Image1) || hotel.Image1.Contains("picsum.photos")))
                {
                    hotel.Image1 = s.Image1;
                    hotel.Image2 = s.Image2;
                }

                // Dữ liệu cũ dồn nhiều khách sạn cho owner1/owner2 → trả về đúng chủ riêng.
                // Chỉ chuyển khi chủ hiện tại là một tài khoản owner mẫu.
                var rightOwner = db.Users.FirstOrDefault(u => u.Email == s.OwnerEmail);
                var currentOwnerEmail = db.Users.Where(u => u.Id == hotel.OwnerId).Select(u => u.Email).FirstOrDefault();
                if (rightOwner != null && hotel.OwnerId != rightOwner.Id &&
                    Owners.Any(o => o.Email == currentOwnerEmail) &&
                    !db.Hotels.Any(h => h.OwnerId == rightOwner.Id)) // không vi phạm 1 owner 1 khách sạn
                {
                    hotel.OwnerId = rightOwner.Id;
                }
            }
        }

        db.SaveChanges();
    }

    private static string Picsum(string name, string suffix) =>
        $"https://picsum.photos/seed/{Uri.EscapeDataString(name)}{suffix}/800/500";

    private static User NewUser(string name, string email, string password, string role) => new()
    {
        Name = name,
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Role = role
    };
}
