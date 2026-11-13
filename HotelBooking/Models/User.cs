namespace HotelBooking.Models;

public static class Roles
{
    public const string Admin = "admin";
    public const string Owner = "owner";
    public const string Customer = "customer";
}

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = Roles.Customer;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public List<Hotel> Hotels { get; set; } = new();
    public List<Booking> Bookings { get; set; } = new();
}
