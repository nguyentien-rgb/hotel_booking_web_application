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

    [Required(ErrorMessage = "Please enter your phone number.")]
    [RegularExpression(@"^[0-9+ ]{9,15}$", ErrorMessage = "Invalid phone number.")]
    public string Phone { get; set; } = "";

    // Chỉ dùng khi đăng ký owner

    [MaxLength(200)]
    public string? BusinessName { get; set; }

    [MaxLength(20)]
    public string? TaxCode { get; set; }
}

public class OwnerProfileRequest
{
    [Required(ErrorMessage = "Please enter your phone number.")]
    [RegularExpression(@"^[0-9+ ]{9,15}$", ErrorMessage = "Invalid phone number.")]
    public string Phone { get; set; } = "";

    [MaxLength(200)]
    public string? BusinessName { get; set; }

    [RegularExpression(@"^[0-9-]{10,14}$", ErrorMessage = "Tax code must be 10-14 digits.")]
    public string? TaxCode { get; set; }
}

public record OwnerProfileDto(string Name, string Email, string? Phone, string? BusinessName, string? TaxCode);

public class LoginRequest
{
    [Required(ErrorMessage = "Please enter your email.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Please enter your password.")]
    public string Password { get; set; } = "";
}

public record UserDto(int Id, string Name, string Email, string Role, string? Phone);

public record AuthResponse(string Token, UserDto User);
