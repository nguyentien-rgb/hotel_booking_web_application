namespace HotelBooking.Models;

public static class HotelStatus
{
    public const string Pending = "pending";
    public const string Approved = "approved";
    public const string Rejected = "rejected";
}

public class Hotel
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public string Name { get; set; } = "";
    public string? Location { get; set; }
    public decimal Price { get; set; }
    public decimal Rating { get; set; }
    public string? Description { get; set; }
    public string? Image1 { get; set; }
    public string? Image2 { get; set; }
    public string Status { get; set; } = HotelStatus.Pending;
    public DateTime CreatedAt { get; set; }

    public User? Owner { get; set; }
    public List<Booking> Bookings { get; set; } = new();
}
