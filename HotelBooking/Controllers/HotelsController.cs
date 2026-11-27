using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

[Route("api/hotels")]
public class HotelsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public HotelsController(AppDbContext db) => _db = db;

    // Khách và customer chỉ thấy khách sạn đã được admin duyệt, của owner chưa bị khoá
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var hotels = await _db.Hotels
            .Where(h => h.Status == HotelStatus.Approved && h.Owner!.IsActive)
            .OrderByDescending(h => h.Rating)
            .ToListAsync();

        return Ok(hotels.Select(HotelDto.From));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var hotel = await _db.Hotels
            .FirstOrDefaultAsync(h => h.Id == id && h.Status == HotelStatus.Approved && h.Owner!.IsActive);

        if (hotel == null) return Error(404, "Hotel not found.");
        return Ok(HotelDto.From(hotel));
    }
}
