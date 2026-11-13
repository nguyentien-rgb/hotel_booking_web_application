using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public AdminController(AppDbContext db) => _db = db;

    // ===== THỐNG KÊ =====

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        // Doanh thu: chỉ tính booking đã xác nhận hoặc đã hoàn thành
        var revenue = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed)
            .SumAsync(b => (decimal?)b.Total) ?? 0;

        var stats = new AdminStatsDto(
            TotalUsers: await _db.Users.CountAsync(),
            TotalCustomers: await _db.Users.CountAsync(u => u.Role == Roles.Customer),
            TotalOwners: await _db.Users.CountAsync(u => u.Role == Roles.Owner),
            TotalHotels: await _db.Hotels.CountAsync(),
            PendingHotels: await _db.Hotels.CountAsync(h => h.Status == HotelStatus.Pending),
            TotalBookings: await _db.Bookings.CountAsync(),
            PendingBookings: await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Pending),
            Revenue: revenue);

        return Ok(stats);
    }

    // ===== KHÁCH SẠN =====

    // ?status=pending để lấy danh sách chờ duyệt
    [HttpGet("hotels")]
    public async Task<IActionResult> Hotels([FromQuery] string? status)
    {
        var query = _db.Hotels.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(h => h.Status == status);

        var hotels = await query
            .OrderByDescending(h => h.CreatedAt)
            .Select(h => new AdminHotelDto(
                h.Id, h.Name, h.Location, h.Price, h.Rating, h.Status,
                h.OwnerId, h.Owner!.Name, h.Owner.Email, h.Image1, h.CreatedAt))
            .ToListAsync();

        return Ok(hotels);
    }

    [HttpPut("hotels/{id:int}/approve")]
    public Task<IActionResult> Approve(int id) => SetHotelStatus(id, HotelStatus.Approved);

    [HttpPut("hotels/{id:int}/reject")]
    public Task<IActionResult> Reject(int id) => SetHotelStatus(id, HotelStatus.Rejected);

    private async Task<IActionResult> SetHotelStatus(int id, string status)
    {
        var hotel = await _db.Hotels.FindAsync(id);
        if (hotel == null) return Error(404, "Hotel not found.");

        hotel.Status = status;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, id = hotel.Id, status = hotel.Status });
    }

    // ===== NGƯỜI DÙNG =====

    // ?role=owner để lọc theo vai trò
    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] string? role)
    {
        var query = _db.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);

        var users = await query
            .OrderBy(u => u.Role).ThenBy(u => u.Id)
            .Select(u => new AdminUserDto(u.Id, u.Name, u.Email, u.Role, u.IsActive, u.CreatedAt,
                u.Phone,
                u.OwnerProfile != null ? u.OwnerProfile.BusinessName : null))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{id:int}/lock")]
    public Task<IActionResult> Lock(int id) => SetUserActive(id, false);

    [HttpPut("users/{id:int}/unlock")]
    public Task<IActionResult> Unlock(int id) => SetUserActive(id, true);

    private async Task<IActionResult> SetUserActive(int id, bool active)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return Error(404, "User not found.");

        // Không cho khoá tài khoản admin (kể cả chính mình)
        if (user.Role == Roles.Admin)
            return Error(400, "Admin accounts cannot be locked.");

        user.IsActive = active;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, id = user.Id, isActive = user.IsActive });
    }

    // ===== BOOKING =====

    [HttpGet("bookings")]
    public async Task<IActionResult> Bookings([FromQuery] string? status)
    {
        var query = _db.Bookings.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(b => b.Status == status);

        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new AdminBookingDto(
                b.Id, b.Hotel!.Name, b.Hotel.Owner!.Name, b.User!.Name, b.User.Email,
                b.CheckIn, b.CheckOut, b.Guests, b.Nights, b.Total, b.Status, b.CreatedAt))
            .ToListAsync();

        return Ok(bookings);
    }
}
