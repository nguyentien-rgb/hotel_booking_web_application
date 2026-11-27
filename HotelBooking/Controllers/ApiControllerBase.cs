using Microsoft.AspNetCore.Mvc;

namespace HotelBooking.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    // Id của người đang đăng nhập, đọc từ JWT (không nhận từ frontend)
    protected int CurrentUserId => int.Parse(User.FindFirst("sub")!.Value);

    // Ngày hiện tại theo giờ Việt Nam, không phụ thuộc múi giờ máy chủ
    private static readonly TimeZoneInfo VnZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
    protected static DateOnly Today =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnZone));

    protected IActionResult Error(int statusCode, string message) =>
        StatusCode(statusCode, new { message });
}
