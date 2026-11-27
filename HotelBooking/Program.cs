using System.Text;
using System.Threading.RateLimiting;
using HotelBooking.Data;
using HotelBooking.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(o =>
        // Lỗi validate trả { message } giống ApiControllerBase.Error để frontend hiển thị được
        o.InvalidModelStateResponseFactory = ctx => new BadRequestObjectResult(new
        {
            message = ctx.ModelState.Values.SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage).FirstOrDefault() ?? "Invalid request."
        }));
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddScoped<TokenService>();

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        // Giữ nguyên tên claim "sub", "role" như TokenService tạo (ApiControllerBase đọc "sub")
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
            NameClaimType = "name",
            RoleClaimType = "role"
        };

        // Mỗi request kiểm tra user còn tồn tại và chưa bị khoá; sai thì trả 401
        o.Events = new JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var id = int.Parse(ctx.Principal!.FindFirst("sub")!.Value);
                if (!await db.Users.AnyAsync(u => u.Id == id && u.IsActive))
                    ctx.Fail("Account locked or deleted.");
            }
        };
    });
builder.Services.AddAuthorization();

// Chống dò mật khẩu / spam tài khoản: giới hạn login + register theo IP.
// Đọc từ cấu hình để test (đăng nhập nhiều lần liên tục) đặt được giới hạn cao hơn.
var authPerMinute = builder.Configuration.GetValue("RateLimit:AuthPerMinute", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.OnRejected = (ctx, ct) => new ValueTask(ctx.HttpContext.Response.WriteAsJsonAsync(
        new { message = "Too many attempts. Please wait a minute and try again." }, ct));
    o.AddPolicy("auth", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = authPerMinute, Window = TimeSpan.FromMinutes(1) }));
});

// Frontend là HTML tĩnh chạy ở origin khác (Live Server / file), không dùng cookie
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    DbSeeder.Seed(scope.ServiceProvider.GetRequiredService<AppDbContext>());
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Lỗi chưa bắt: trả { message } như mọi lỗi khác, không lộ stack trace (middleware vẫn ghi log lỗi)
app.UseExceptionHandler(errorApp => errorApp.Run(ctx =>
{
    ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
    return ctx.Response.WriteAsJsonAsync(new { message = "Something went wrong on the server. Please try again." });
}));

app.UseCors(); // trước rate limiter để phản hồi 429 vẫn có header CORS, frontend đọc được message
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Cho project HotelBooking.Tests dựng API trong bộ nhớ (WebApplicationFactory<Program>)
public partial class Program { }
