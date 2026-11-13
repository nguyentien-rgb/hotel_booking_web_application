using System.ComponentModel.DataAnnotations;

namespace HotelBooking.Dtos;

public class CreateBookingRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Invalid hotel.")]
    public int HotelId { get; set; }

    [Required(ErrorMessage = "Please choose a check-in date.")]
    public DateOnly? CheckIn { get; set; }

    [Required(ErrorMessage = "Please choose a check-out date.")]
    public DateOnly? CheckOut { get; set; }

    [Range(1, 20, ErrorMessage = "Guests must be between 1 and 20.")]
    public int Guests { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }
}

public record BookingDto(
    int Id,
    int HotelId,
    string HotelName,
    string? Location,
    DateOnly CheckIn,
    DateOnly CheckOut,
    int Guests,
    int Nights,
    decimal Total,
    string? PaymentMethod,
    string Status,
    DateTime CreatedAt);
