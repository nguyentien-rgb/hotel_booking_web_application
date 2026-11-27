using HotelBooking.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<OwnerProfile> OwnerProfiles => Set<OwnerProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users", t => t.HasCheckConstraint("CK_users_role", "role IN ('admin','owner','customer')"));
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100);
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(255);
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(255);
            e.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(20);
            e.Property(x => x.Role).HasColumnName("role").HasMaxLength(20);
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("SYSDATETIME()");
            e.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<OwnerProfile>(e =>
        {
            e.ToTable("owner_profiles");
            e.HasKey(x => x.UserId);
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.BusinessName).HasColumnName("business_name").HasMaxLength(200);
            e.Property(x => x.TaxCode).HasColumnName("tax_code").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("SYSDATETIME()");
            e.HasOne(x => x.User).WithOne(u => u.OwnerProfile)
                .HasForeignKey<OwnerProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Hotel>(e =>
        {
            e.ToTable("hotels", t => t.HasCheckConstraint("CK_hotels_status", "status IN ('pending','approved','rejected')"));
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.OwnerId).HasColumnName("owner_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
            e.Property(x => x.Location).HasColumnName("location").HasMaxLength(200);
            e.Property(x => x.Price).HasColumnName("price").HasPrecision(12, 0);
            e.Property(x => x.Rating).HasColumnName("rating").HasPrecision(2, 1);
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Image1).HasColumnName("image1").HasMaxLength(500);
            e.Property(x => x.Image2).HasColumnName("image2").HasMaxLength(500);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("SYSDATETIME()");
            e.HasOne(x => x.Owner).WithMany(u => u.Hotels).HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
            // Luật nghiệp vụ: mỗi owner đúng 1 khách sạn (DB cũ được nâng cấp trong DbSeeder.EnsureSchema)
            e.HasIndex(x => x.OwnerId).IsUnique();
        });

        modelBuilder.Entity<Booking>(e =>
        {
            e.ToTable("bookings", t => t.HasCheckConstraint("CK_bookings_status", "status IN ('pending','confirmed','cancelled','completed')"));
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.HotelId).HasColumnName("hotel_id");
            e.Property(x => x.CheckIn).HasColumnName("check_in");
            e.Property(x => x.CheckOut).HasColumnName("check_out");
            e.Property(x => x.Guests).HasColumnName("guests");
            e.Property(x => x.Nights).HasColumnName("nights");
            e.Property(x => x.Total).HasColumnName("total").HasPrecision(14, 0);
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasMaxLength(50);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("SYSDATETIME()");
            e.HasOne(x => x.User).WithMany(u => u.Bookings).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Hotel).WithMany(h => h.Bookings).HasForeignKey(x => x.HotelId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
