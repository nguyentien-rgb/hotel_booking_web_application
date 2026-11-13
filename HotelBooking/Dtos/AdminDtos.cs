namespace HotelBooking.Dtos;

public record AdminStatsDto(
    int TotalUsers,
    int TotalCustomers,
    int TotalOwners,
    int TotalHotels,
    int PendingHotels,
    int TotalBookings,
    int PendingBookings,
    decimal Revenue);

public record AdminHotelDto(
    int Id,
    string Name,
    string? Location,
    decimal Price,
    decimal Rating,
    string Status,
    int OwnerId,
    string OwnerName,
    string OwnerEmail,
    string? Image,
    DateTime CreatedAt);

public record AdminUserDto(
    int Id,
    string Name,
    string Email,
    string Role,
    bool IsActive,
    DateTime CreatedAt,
    string? Phone,
    string? BusinessName);

public record AdminBookingDto(
    int Id,
    string HotelName,
    string OwnerName,
    string GuestName,
    string GuestEmail,
    DateOnly CheckIn,
    DateOnly CheckOut,
    int Guests,
    int Nights,
    decimal Total,
    string Status,
    DateTime CreatedAt);
