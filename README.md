# Luxury Hotel Booking

A hotel booking web application with three roles: customer, hotel owner, and administrator.
The backend is a REST API built with ASP.NET Core; the frontend is plain HTML/CSS/JavaScript that calls the API with `fetch`.

## Features

**Guest (not logged in)**
- Browse, search and view hotel details freely
- Clicking "Book now" redirects to login, then returns to the booking page

**Customer**
- Book a room; the server calculates nights and total price
- View booking history with status, cancel a booking before check-in

**Hotel owner**
- Add, edit and delete their own hotels (new or edited hotels need admin approval)
- Confirm or reject incoming bookings, mark stays as completed

**Admin**
- Dashboard with users, hotels, bookings and revenue statistics
- Approve or reject hotels
- Lock or unlock user accounts
- View all bookings

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core 10 Web API (C#) |
| Database | SQL Server (LocalDB), Entity Framework Core |
| Authentication | JWT (JSON Web Token), passwords hashed with BCrypt |
| Authorization | Role-based: `admin`, `owner`, `customer` |
| Frontend | HTML, CSS, vanilla JavaScript |

## Getting Started

**Requirements:** Visual Studio 2026 (ASP.NET and web development workload, includes .NET 10 and SQL Server LocalDB), VS Code with the Live Server extension.

1. Clone the repository:
   ```bash
   git clone https://github.com/nguyentien-rgb/hotel_booking_web_application.git
   ```
2. Set the JWT secret key (not stored in source code). Open a terminal in the `HotelBooking` folder:
   ```bash
   dotnet user-secrets set "Jwt:Key" "a-secret-key-longer-than-32-characters"
   ```
3. Open `HotelBooking/HotelBooking.slnx` in Visual Studio and press **F5**. The API runs at `http://localhost:4000`. On first run it creates the `hotel_booking` database with sample data.
4. Open the root folder in VS Code, right-click `home/index.html` → **Open with Live Server**.

If you are not using LocalDB, update the connection string in `HotelBooking/appsettings.json`.

## Project Structure

```
hotel_booking_web_application/
├── HotelBooking/          
│   ├── Controllers/       
│   ├── Data/              
│   ├── Dtos/              
│   ├── Models/            
│   └── Services/          
├── home/ search/ hotel-detail/ booking/ payment/
├── login/ register/ profile/
├── owner/
├── admin/
└── shared/                
```

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@hotel.com | admin123 |
| Hotel owner (Hạ Long) | owner1@hotel.com | owner123 |
| Hotel owner (Sa Pa) | owner2@hotel.com | owner123 |
| Customer | user@hotel.com | user123 |

Each hotel has its own owner account. Other owners: `owner.ninhbinh`, `owner.hanoi`, `owner.hagiang`, `owner.laocai`, `owner.phutho`, `owner.mucangchai`, `owner.danang` (all `@hotel.com`, password `owner123`).

## Author

**Nguyễn Ngọc Tiến** – Student at Hanoi University of Industry (HaUI)

- GitHub: [nguyentien-rgb](https://github.com/nguyentien-rgb)