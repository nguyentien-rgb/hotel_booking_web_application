using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using HotelBooking.Data;
using Microsoft.Extensions.DependencyInjection;

namespace HotelBooking.Tests;

// Mỗi test dùng một khách sạn mẫu / khoảng ngày riêng vì cả lớp dùng chung một database.
public class BookingRulesTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string Customer = "user@hotel.com", CustomerPw = "user123";
    private const string Admin = "admin@hotel.com", AdminPw = "admin123";
    private const string OwnerPw = "owner123";

    private static readonly TimeZoneInfo VnZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
    private static DateOnly Today => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VnZone));

    [Fact]
    public async Task Total_is_price_times_nights_times_guests()
    {
        var c = await LoginAs(Customer, CustomerPw);
        var hotel = HotelOf("owner1@hotel.com"); // 1.200.000 / khách / đêm

        var res = await Book(c, hotel, Today.AddDays(100), Today.AddDays(103), guests: 2);

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await Json(res);
        Assert.Equal(3, body.GetProperty("nights").GetInt32());
        Assert.Equal(1_200_000m * 3 * 2, body.GetProperty("total").GetDecimal());
    }

    [Fact]
    public async Task Stay_longer_than_30_nights_is_rejected()
    {
        var c = await LoginAs(Customer, CustomerPw);

        var res = await Book(c, HotelOf("owner1@hotel.com"), Today.AddDays(10), Today.AddDays(41));

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Same_customer_cannot_book_overlapping_dates_at_same_hotel()
    {
        var c = await LoginAs(Customer, CustomerPw);
        var hotel = HotelOf("owner2@hotel.com");

        Assert.Equal(HttpStatusCode.Created, (await Book(c, hotel, Today.AddDays(200), Today.AddDays(203))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await Book(c, hotel, Today.AddDays(201), Today.AddDays(202))).StatusCode);
        // Nối tiếp (nhận phòng đúng ngày trả phòng trước) thì được
        Assert.Equal(HttpStatusCode.Created, (await Book(c, hotel, Today.AddDays(203), Today.AddDays(204))).StatusCode);
    }

    [Fact]
    public async Task Customer_cannot_cancel_on_check_in_day()
    {
        var c = await LoginAs(Customer, CustomerPw);
        var res = await Book(c, HotelOf("owner.ninhbinh@hotel.com"), Today, Today.AddDays(1));
        var id = (await Json(res)).GetProperty("bookingId").GetInt32();

        var cancel = await c.PutAsync($"/api/bookings/{id}/cancel", null);

        Assert.Equal(HttpStatusCode.BadRequest, cancel.StatusCode);
    }

    [Fact]
    public async Task Owner_cannot_touch_another_owners_booking()
    {
        var c = await LoginAs(Customer, CustomerPw);
        var res = await Book(c, HotelOf("owner.hanoi@hotel.com"), Today.AddDays(300), Today.AddDays(301));
        var id = (await Json(res)).GetProperty("bookingId").GetInt32();

        var other = await LoginAs("owner2@hotel.com", OwnerPw);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsync($"/api/owner/bookings/{id}/confirm", null)).StatusCode);

        var mine = await LoginAs("owner.hanoi@hotel.com", OwnerPw);
        Assert.Equal(HttpStatusCode.OK, (await mine.PutAsync($"/api/owner/bookings/{id}/confirm", null)).StatusCode);
    }

    [Fact]
    public async Task Owner_can_cancel_confirmed_booking_but_not_complete_it_before_check_out()
    {
        var c = await LoginAs(Customer, CustomerPw);
        var res = await Book(c, HotelOf("owner.laocai@hotel.com"), Today.AddDays(400), Today.AddDays(402));
        var id = (await Json(res)).GetProperty("bookingId").GetInt32();
        var owner = await LoginAs("owner.laocai@hotel.com", OwnerPw);

        await owner.PutAsync($"/api/owner/bookings/{id}/confirm", null);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PutAsync($"/api/owner/bookings/{id}/complete", null)).StatusCode);

        var cancel = await owner.PutAsync($"/api/owner/bookings/{id}/cancel", null);
        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);
        Assert.Equal("cancelled", (await Json(cancel)).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Locked_user_old_token_stops_working_immediately()
    {
        var anon = factory.CreateClient();
        await anon.PostAsJsonAsync("/api/auth/register", new
        {
            name = "Lock Test", email = "locktest@test.com", password = "secret123", phone = "0900000001"
        });
        var user = await LoginAs("locktest@test.com", "secret123");
        Assert.Equal(HttpStatusCode.OK, (await user.GetAsync("/api/bookings")).StatusCode);

        var admin = await LoginAs(Admin, AdminPw);
        var userId = Db(db => db.Users.Single(u => u.Email == "locktest@test.com").Id);
        await admin.PutAsync($"/api/admin/users/{userId}/lock", null);

        Assert.Equal(HttpStatusCode.Unauthorized, (await user.GetAsync("/api/bookings")).StatusCode);
    }

    [Fact]
    public async Task Hotel_of_locked_owner_is_hidden_and_not_bookable()
    {
        const string ownerEmail = "owner.phutho@hotel.com";
        var hotel = HotelOf(ownerEmail);
        var ownerId = Db(db => db.Users.Single(u => u.Email == ownerEmail).Id);
        var admin = await LoginAs(Admin, AdminPw);
        var c = await LoginAs(Customer, CustomerPw);

        await admin.PutAsync($"/api/admin/users/{ownerId}/lock", null);
        try
        {
            Assert.Equal(HttpStatusCode.NotFound, (await c.GetAsync($"/api/hotels/{hotel}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await Book(c, hotel, Today.AddDays(500), Today.AddDays(501))).StatusCode);
        }
        finally
        {
            await admin.PutAsync($"/api/admin/users/{ownerId}/unlock", null);
        }

        Assert.Equal(HttpStatusCode.OK, (await c.GetAsync($"/api/hotels/{hotel}")).StatusCode);
    }

    [Fact]
    public async Task Blank_hotel_fields_are_saved_as_null_not_empty_string()
    {
        const string ownerEmail = "owner.mucangchai@hotel.com";
        var owner = await LoginAs(ownerEmail, OwnerPw);
        var hotel = HotelOf(ownerEmail);

        var res = await owner.PutAsJsonAsync($"/api/owner/hotels/{hotel}", new
        {
            name = "Mu Cang Chai Terrace Homestay", location = "  ", price = 600000,
            description = "", image1 = "", image2 = (string?)null
        });

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var saved = Db(db => db.Hotels.Single(h => h.Id == hotel));
        Assert.Null(saved.Location);
        Assert.Null(saved.Description);
        Assert.Null(saved.Image1);
    }

    // ---------- helpers ----------

    private async Task<HttpClient> LoginAs(string email, string password)
    {
        var client = factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        res.EnsureSuccessStatusCode();
        var token = (await Json(res)).GetProperty("token").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static Task<HttpResponseMessage> Book(HttpClient c, int hotelId, DateOnly checkIn, DateOnly checkOut, int guests = 1) =>
        c.PostAsJsonAsync("/api/bookings", new { hotelId, checkIn, checkOut, guests, paymentMethod = "card" });

    private int HotelOf(string ownerEmail) =>
        Db(db => db.Hotels.Single(h => h.Owner!.Email == ownerEmail).Id);

    private T Db<T>(Func<AppDbContext, T> query)
    {
        using var scope = factory.Services.CreateScope();
        return query(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private static async Task<JsonElement> Json(HttpResponseMessage res) =>
        await res.Content.ReadFromJsonAsync<JsonElement>();
}
