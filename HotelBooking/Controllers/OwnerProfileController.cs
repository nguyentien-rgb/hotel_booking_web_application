using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

// Hồ sơ của chủ khách sạn đang đăng nhập
[Route("api/owner/profile")]
[Authorize(Roles = Roles.Owner)]
public class OwnerProfileController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public OwnerProfileController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var userId = CurrentUserId;
        var user = await _db.Users.Include(u => u.OwnerProfile).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Error(404, "User not found.");

        var p = user.OwnerProfile;
        return Ok(new OwnerProfileDto(user.Name, user.Email, user.Phone, p?.BusinessName, p?.TaxCode));
    }

    // Tạo mới nếu chưa có, có rồi thì cập nhật
    [HttpPut]
    public async Task<IActionResult> Save(OwnerProfileRequest req)
    {
        var userId = CurrentUserId;
        var user = await _db.Users.Include(u => u.OwnerProfile).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Error(404, "User not found.");

        user.OwnerProfile ??= new OwnerProfile { UserId = user.Id };
        user.Phone = req.Phone.Trim();
        user.OwnerProfile.BusinessName = string.IsNullOrWhiteSpace(req.BusinessName) ? null : req.BusinessName.Trim();
        user.OwnerProfile.TaxCode = string.IsNullOrWhiteSpace(req.TaxCode) ? null : req.TaxCode.Trim();

        await _db.SaveChangesAsync();

        var p = user.OwnerProfile;
        return Ok(new OwnerProfileDto(user.Name, user.Email, user.Phone, p.BusinessName, p.TaxCode));
    }
}
