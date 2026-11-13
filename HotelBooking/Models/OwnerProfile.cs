namespace HotelBooking.Models;

// Thông tin riêng của chủ khách sạn, quan hệ 1-1 với users (user_id vừa là khoá chính vừa là khoá ngoại).
// Đăng nhập vẫn dùng chung bảng users cho mọi vai trò.
public class OwnerProfile
{
    public int UserId { get; set; }
    public string? BusinessName { get; set; }
    public string? TaxCode { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
}
