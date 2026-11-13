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
