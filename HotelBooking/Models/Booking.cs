namespace HotelBooking.Models;

public static class BookingStatus
{
    public const string Pending = "pending";
    public const string Confirmed = "confirmed";
    public const string Cancelled = "cancelled";
    public const string Completed = "completed";
}

public class Booking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int HotelId { get; set; }
    public DateOnly CheckIn { get; set; }
    public DateOnly CheckOut { get; set; }
    public int Guests { get; set; }
    public int Nights { get; set; }
    public decimal Total { get; set; }
    public string? PaymentMethod { get; set; }
    public string Status { get; set; } = BookingStatus.Pending;
    public DateTime CreatedAt { get; set; }

    public User? User { get; set; }
    public Hotel? Hotel { get; set; }
}
