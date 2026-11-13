using System.ComponentModel.DataAnnotations;
using HotelBooking.Models;

namespace HotelBooking.Dtos;

public record HotelDto(
    int Id,
    string Name,
    string? Location,
    decimal Price,
    decimal Rating,
    string? Description,
    string[] Images,
    string Status)
{
    public static HotelDto From(Hotel h) => new(
        h.Id, h.Name, h.Location, h.Price, h.Rating, h.Description,
        new[] { h.Image1, h.Image2 }.Where(x => !string.IsNullOrEmpty(x)).Select(x => x!).ToArray(),
        h.Status);
}

// Dữ liệu owner được phép gửi lên khi thêm/sửa khách sạn.
// Không có OwnerId, Status, Rating: server tự gán, owner không tự đặt được.
public class SaveHotelRequest
{
    [Required(ErrorMessage = "Please enter the hotel name.")]
    [MaxLength(200)]
    public string Name { get; set; } = "";

    [MaxLength(200)]
    public string? Location { get; set; }

    [Range(1, 1_000_000_000, ErrorMessage = "Price must be greater than 0.")]
    public decimal Price { get; set; }

    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Image1 { get; set; }

    [MaxLength(500)]
    public string? Image2 { get; set; }
}
