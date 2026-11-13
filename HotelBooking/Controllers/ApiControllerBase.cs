using Microsoft.AspNetCore.Mvc;

namespace HotelBooking.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    // Id của người đang đăng nhập, đọc từ JWT (không nhận từ frontend)
    protected int CurrentUserId => int.Parse(User.FindFirst("sub")!.Value);

    protected IActionResult Error(int statusCode, string message) =>
        StatusCode(statusCode, new { message });
}
