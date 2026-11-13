using System.ComponentModel.DataAnnotations;

namespace HotelBooking.Dtos;

public class RegisterRequest
{
    [Required(ErrorMessage = "Please enter your name.")]
    [MaxLength(100)]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "Please enter your email.")]
    [EmailAddress(ErrorMessage = "Invalid email.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Please enter a password.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
    public string Password { get; set; } = "";

    // "customer" hoặc "owner"; không cho tự đăng ký admin
    public string? Role { get; set; }
}

public class LoginRequest
{
    [Required(ErrorMessage = "Please enter your email.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Please enter your password.")]
    public string Password { get; set; } = "";
}

public record UserDto(int Id, string Name, string Email, string Role);

public record AuthResponse(string Token, UserDto User);
