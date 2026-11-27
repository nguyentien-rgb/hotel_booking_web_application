using HotelBooking.Data;
using HotelBooking.Dtos;
using HotelBooking.Models;
using HotelBooking.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Controllers;

[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLower();
        var role = req.Role == Roles.Owner ? Roles.Owner : Roles.Customer;

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Error(409, "Email already registered. Please login.");

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = email,
            Phone = req.Phone.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = role
        };

        // Owner: tạo luôn hồ sơ chủ khách sạn (lưu cùng 1 lần SaveChanges)
        if (role == Roles.Owner)
        {
            user.OwnerProfile = new OwnerProfile
            {
                BusinessName = string.IsNullOrWhiteSpace(req.BusinessName) ? null : req.BusinessName.Trim(),
                TaxCode = string.IsNullOrWhiteSpace(req.TaxCode) ? null : req.TaxCode.Trim()
            };
        }

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Hai request cùng email lọt qua AnyAsync cùng lúc; unique index chặn request thứ hai
            return Error(409, "Email already registered. Please login.");
        }

        return StatusCode(201, ToResponse(user));
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLower();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Error(401, "Invalid email or password.");

        if (!user.IsActive)
            return Error(403, "Your account has been locked.");

        return Ok(ToResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return Error(404, "User not found.");
        return Ok(new UserDto(user.Id, user.Name, user.Email, user.Role, user.Phone));
    }

    private AuthResponse ToResponse(User user) =>
        new(_tokens.CreateToken(user), new UserDto(user.Id, user.Name, user.Email, user.Role, user.Phone));
}
