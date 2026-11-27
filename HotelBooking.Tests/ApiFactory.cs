using HotelBooking.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Tests;

// Dựng API trong bộ nhớ, trỏ vào một database test riêng trên LocalDB.
// Không dùng SQLite vì SQLite không ORDER BY / SUM được cột decimal mà API đang dùng.
// Database được xoá ở đầu mỗi lần chạy, sau đó DbSeeder tạo lại dữ liệu mẫu khi API khởi động.
public class ApiFactory : WebApplicationFactory<Program>
{
    // Mỗi lớp factory một database: xUnit chạy các lớp test song song
    protected virtual string DatabaseName => "hotel_booking_test";

    // Test đăng nhập nhiều lần liên tục nên nới giới hạn; giới hạn thật được kiểm ở RateLimitTests
    protected virtual int AuthPerMinute => 1000;

    private string ConnectionString =>
        $@"Server=(localdb)\MSSQLLocalDB;Database={DatabaseName};Trusted_Connection=True;TrustServerCertificate=True";

    public ApiFactory()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(ConnectionString).Options);
        db.Database.EnsureDeleted();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        // Key chỉ dùng cho test; key thật nằm trong user secrets
        builder.UseSetting("Jwt:Key", "test-only-signing-key-that-is-at-least-32-bytes");
        builder.UseSetting("RateLimit:AuthPerMinute", AuthPerMinute.ToString());
    }
}

public class StrictRateLimitFactory : ApiFactory
{
    protected override string DatabaseName => "hotel_booking_test_ratelimit";
    protected override int AuthPerMinute => 3;
}
