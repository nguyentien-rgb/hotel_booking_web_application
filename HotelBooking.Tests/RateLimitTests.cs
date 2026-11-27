using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace HotelBooking.Tests;

public class RateLimitTests(StrictRateLimitFactory factory) : IClassFixture<StrictRateLimitFactory>
{
    [Fact]
    public async Task Login_is_blocked_after_limit_with_readable_message()
    {
        var client = factory.CreateClient();
        var wrong = new { email = "user@hotel.com", password = "wrong-password" };

        for (var i = 0; i < 3; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", wrong)).StatusCode);

        var blocked = await client.PostAsJsonAsync("/api/auth/login", wrong);

        Assert.Equal(HttpStatusCode.TooManyRequests, blocked.StatusCode);
        var body = await blocked.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrEmpty(body.GetProperty("message").GetString()));
    }
}
