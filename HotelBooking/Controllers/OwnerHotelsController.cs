using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

[Route("api/owner/hotels")]
[Authorize(Roles = Roles.Owner)]
public class OwnerHotelsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public OwnerHotelsController(AppDbContext db) => _db = db;

    // Danh sách khách sạn của chính owner đang đăng nhập (mọi trạng thái)
    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var ownerId = CurrentUserId;

        var hotels = await _db.Hotels
            .Where(h => h.OwnerId == ownerId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        return Ok(hotels.Select(HotelDto.From));
    }

    // Thêm khách sạn mới: luôn ở trạng thái chờ admin duyệt
    [HttpPost]
    public async Task<IActionResult> Create(SaveHotelRequest req)
    {
        // Luật nghiệp vụ: mỗi chủ chỉ đăng ký 1 khách sạn
        var ownerId = CurrentUserId;
        if (await _db.Hotels.AnyAsync(h => h.OwnerId == ownerId))
            return Error(400, "Each owner can only register one hotel.");

        var hotel = new Hotel
        {
            OwnerId = ownerId,
            Status = HotelStatus.Pending
        };
        Apply(hotel, req);

        _db.Hotels.Add(hotel);
        await _db.SaveChangesAsync();

        return StatusCode(201, HotelDto.From(hotel));
    }

    // Sửa: chỉ sửa được khách sạn của mình, sửa xong phải chờ duyệt lại
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, SaveHotelRequest req)
    {
        var hotel = await FindMine(id);
        if (hotel == null) return Error(404, "Hotel not found.");

        Apply(hotel, req);
        hotel.Status = HotelStatus.Pending;
        await _db.SaveChangesAsync();

        return Ok(HotelDto.From(hotel));
    }

    // Xoá: không cho xoá nếu đã có người đặt
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var hotel = await FindMine(id);
        if (hotel == null) return Error(404, "Hotel not found.");

        if (await _db.Bookings.AnyAsync(b => b.HotelId == id))
            return Error(400, "Cannot delete a hotel that already has bookings.");

        _db.Hotels.Remove(hotel);
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    // Luôn lọc theo owner_id: owner A không động được vào khách sạn của owner B
    private Task<Hotel?> FindMine(int id)
    {
        var ownerId = CurrentUserId;
        return _db.Hotels.FirstOrDefaultAsync(h => h.Id == id && h.OwnerId == ownerId);
    }

    private static void Apply(Hotel hotel, SaveHotelRequest req)
    {
        hotel.Name = req.Name.Trim();
        hotel.Location = req.Location?.Trim();
        hotel.Price = req.Price;
        hotel.Description = req.Description?.Trim();
        hotel.Image1 = req.Image1?.Trim();
        hotel.Image2 = req.Image2?.Trim();
    }
}
