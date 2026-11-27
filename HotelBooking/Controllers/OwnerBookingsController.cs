using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

[Route("api/owner/bookings")]
[Authorize(Roles = Roles.Owner)]
public class OwnerBookingsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public OwnerBookingsController(AppDbContext db) => _db = db;

    // Booking vào các khách sạn của owner đang đăng nhập.
    // ?status=pending để chỉ lấy booking đang chờ xác nhận.
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] string? status)
    {
        var ownerId = CurrentUserId;

        var query = _db.Bookings.Where(b => b.Hotel!.OwnerId == ownerId);
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(b => b.Status == status);

        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new OwnerBookingDto(
                b.Id, b.HotelId, b.Hotel!.Name, b.User!.Name, b.User.Email,
                b.CheckIn, b.CheckOut, b.Guests, b.Nights, b.Total,
                b.PaymentMethod, b.Status, b.CreatedAt))
            .ToListAsync();

        return Ok(bookings);
    }

    // pending → confirmed
    [HttpPut("{id:int}/confirm")]
    public Task<IActionResult> Confirm(int id) =>
        ChangeStatus(id, from: BookingStatus.Pending, to: BookingStatus.Confirmed);

    // pending → cancelled (chủ khách sạn từ chối)
    [HttpPut("{id:int}/reject")]
    public Task<IActionResult> Reject(int id) =>
        ChangeStatus(id, from: BookingStatus.Pending, to: BookingStatus.Cancelled);

    // confirmed → cancelled (khách không đến, hoặc khách sạn không phục vụ được);
    // không huỷ thì booking no-show vẫn bị tính vào doanh thu
    [HttpPut("{id:int}/cancel")]
    public Task<IActionResult> Cancel(int id) =>
        ChangeStatus(id, from: BookingStatus.Confirmed, to: BookingStatus.Cancelled);

    // confirmed → completed, chỉ khi khách đã tới ngày trả phòng
    [HttpPut("{id:int}/complete")]
    public Task<IActionResult> Complete(int id) =>
        ChangeStatus(id, from: BookingStatus.Confirmed, to: BookingStatus.Completed,
            check: b => b.CheckOut > Today
                ? "Booking can only be completed on or after the check-out date."
                : null);

    // check: điều kiện thêm, trả về thông báo lỗi hoặc null nếu hợp lệ
    private async Task<IActionResult> ChangeStatus(int id, string from, string to, Func<Booking, string?>? check = null)
    {
        var booking = await FindMine(id);
        if (booking == null) return Error(404, "Booking not found.");

        if (booking.Status != from)
            return Error(400, $"Only {from} bookings can be changed to {to}.");

        if (check?.Invoke(booking) is { } message)
            return Error(400, message);

        booking.Status = to;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, id = booking.Id, status = booking.Status });
    }

    // Chỉ tìm booking thuộc khách sạn của owner đang đăng nhập
    private Task<Booking?> FindMine(int id)
    {
        var ownerId = CurrentUserId;
        return _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && b.Hotel!.OwnerId == ownerId);
    }
}
