using HotelBooking.Models;

namespace HotelBooking.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        db.Database.EnsureCreated();

        if (db.Users.Any()) return;

        var admin = NewUser("Quản trị viên", "admin@hotel.com", "admin123", Roles.Admin);
        var ownerA = NewUser("Chủ khách sạn A", "owner1@hotel.com", "owner123", Roles.Owner);
        var ownerB = NewUser("Chủ khách sạn B", "owner2@hotel.com", "owner123", Roles.Owner);
        var customer = NewUser("Khách hàng mẫu", "user@hotel.com", "user123", Roles.Customer);
        db.Users.AddRange(admin, ownerA, ownerB, customer);

        db.Hotels.AddRange(
            NewHotel(ownerA, "Khách sạn Hạ Long Bay View", "Hạ Long, Quảng Ninh", 1200000, 4.7m,
                "Khách sạn view vịnh, gần bãi tắm Bãi Cháy.", "hotel1", HotelStatus.Approved),
            NewHotel(ownerA, "Hanoi Old Quarter Hotel", "Hoàn Kiếm, Hà Nội", 850000, 4.5m,
                "Nằm giữa phố cổ, đi bộ ra Hồ Gươm 5 phút.", "hotel2", HotelStatus.Approved),
            NewHotel(ownerB, "Sapa Mountain Lodge", "Sa Pa, Lào Cai", 950000, 4.6m,
                "Phòng nhìn ra thung lũng Mường Hoa.", "hotel3", HotelStatus.Approved),
            NewHotel(ownerB, "Đà Nẵng Beach Resort", "Sơn Trà, Đà Nẵng", 1800000, 4.8m,
                "Resort sát biển Mỹ Khê, có hồ bơi.", "hotel4", HotelStatus.Pending)
        );

        db.SaveChanges();
    }

    private static User NewUser(string name, string email, string password, string role) => new()
    {
        Name = name,
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Role = role
    };

    private static Hotel NewHotel(User owner, string name, string location, decimal price, decimal rating,
        string description, string imageSeed, string status) => new()
    {
        Owner = owner,
        Name = name,
        Location = location,
        Price = price,
        Rating = rating,
        Description = description,
        Image1 = $"https://picsum.photos/seed/{imageSeed}a/800/500",
        Image2 = $"https://picsum.photos/seed/{imageSeed}b/800/500",
        Status = status
    };
}
