using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

[Route("api/bookings")]
[Authorize(Roles = Roles.Customer)]
public class BookingsController : ApiControllerBase
{
    // Phải khớp MAX_NIGHTS trong booking/script.js
    private const int MaxNights = 30;

    private readonly AppDbContext _db;
    public BookingsController(AppDbContext db) => _db = db;

    [HttpPost]
    public async Task<IActionResult> Create(CreateBookingRequest req)
    {
        var checkIn = req.CheckIn!.Value;
        var checkOut = req.CheckOut!.Value;
        if (checkIn < Today)
            return Error(400, "Check-in date cannot be in the past.");
        if (checkOut <= checkIn)
            return Error(400, "Check-out date must be after check-in date.");

        var nights = checkOut.DayNumber - checkIn.DayNumber;
        // Chặn ngày trả phòng quá xa: tổng tiền vượt cột decimal(14,0) hoặc booking vô lý
        if (nights > MaxNights)
            return Error(400, $"Maximum stay is {MaxNights} nights.");

        // Khách sạn của owner bị khoá thì coi như không tồn tại
        var hotel = await _db.Hotels
            .FirstOrDefaultAsync(h => h.Id == req.HotelId && h.Status == HotelStatus.Approved && h.Owner!.IsActive);
        if (hotel == null)
            return Error(404, "Hotel not found.");

        var userId = CurrentUserId;
        // Hai khoảng [in, out) giao nhau khi in1 < out2 và out1 > in2
        var overlap = await _db.Bookings.AnyAsync(b =>
            b.UserId == userId && b.HotelId == hotel.Id &&
            b.Status != BookingStatus.Cancelled &&
            b.CheckIn < checkOut && b.CheckOut > checkIn);
        if (overlap)
            return Error(409, "You already have a booking at this hotel for these dates.");

        // Server tự tính tiền, không tin số frontend gửi lên
        var total = hotel.Price * nights * req.Guests;

        var booking = new Booking
        {
            UserId = userId,
            HotelId = hotel.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Guests = req.Guests,
            Nights = nights,
            Total = total,
            PaymentMethod = req.PaymentMethod
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { success = true, bookingId = booking.Id, nights, total });
    }

    // Booking của chính người đang đăng nhập
    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = CurrentUserId;

        var bookings = await _db.Bookings
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookingDto(
                b.Id, b.HotelId, b.Hotel!.Name, b.Hotel.Location,
                b.CheckIn, b.CheckOut, b.Guests, b.Nights, b.Total,
                b.PaymentMethod, b.Status, b.CreatedAt, b.Hotel.Image1))
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpPut("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var userId = CurrentUserId;
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (booking == null)
            return Error(404, "Booking not found.");

        if (booking.Status != BookingStatus.Pending && booking.Status != BookingStatus.Confirmed)
            return Error(400, "This booking cannot be cancelled.");

        if (booking.CheckIn <= Today)
            return Error(400, "Cannot cancel on or after the check-in date.");

        booking.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
}
