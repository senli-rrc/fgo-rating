# FGO Rating App 🎮

A comprehensive rating and review platform for Fate/Grand Order servants, built with modern web technologies and powered by Supabase.

![FGO Rating App](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Features

- **Servant Database**: Browse and search through all FGO servants with detailed information
- **Rating System**: Rate servants and write detailed reviews
- **Community Reviews**: Read reviews from other players with like/reply functionality
- **Rankings**: View top-rated servants by class or overall
- **Admin Panel**: Manage servants and user content (admin only)
- **Multiple Regions**: Support for JP, CN, and EN game data
- **Authentication**: Secure user registration and login via Supabase Auth
- **Responsive Design**: Optimized for desktop and mobile devices

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Data Visualization**: Recharts
- **API**: Atlas Academy API for servant data

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account (free tier available)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/senli-rrc/fgo-rating.git
   cd fgo-rating
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Go to **SQL Editor** and run `supabase-setup.sql`
   
   c. Get your project credentials from **Settings** → **API**

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
fgo-rating/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── ServantCard.tsx
│   │   ├── RatingSystem.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx
│   │   ├── ServantDetailPage.tsx
│   │   ├── ReviewsPage.tsx
│   │   ├── RankingPage.tsx
│   │   └── ...
│   ├── services/           # API and data services
│   │   ├── dbService.ts    # Supabase database operations
│   │   ├── atlasService.ts # FGO API integration
│   │   └── ...
│   ├── lib/                # Utilities and configurations
│   │   └── supabase.ts     # Supabase client
│   ├── App.tsx             # Main app with routing
│   ├── main.tsx            # Entry point
│   └── types.ts            # TypeScript definitions
├── supabase-setup.sql      # Database schema
├── .env.example            # Environment template
└── package.json
```

## 🗺️ Routes

- `/servants` - Home page with servant list
- `/servant/:id` - Servant detail page
- `/servant/:id/reviews` - Servant reviews page
- `/rankings` - Top-rated servants
- `/mainquests` - Main quest information
- `/admin` - Admin dashboard (protected)
- `/login` - User login
- `/register` - User registration

## 🔐 Authentication

### First User (Admin)
The first user to register is automatically assigned the `ADMIN` role.

### User Roles
- **USER**: Can rate servants and write reviews
- **ADMIN**: All user permissions + manage servants and content

## 🗄️ Database Schema

The app uses the following tables:
- `servants` - Servant data from Atlas Academy API
- `users` - User profiles and authentication
- `ratings` - User ratings and reviews
- `replies` - Comments on reviews
- `light_ups` - Like system for reviews
- `wars` - Main quest/war information

## 📝 Features in Detail

### Rating System
- Rate servants from 1-10
- Write detailed reviews with strengths and weaknesses
- Edit your own ratings
- View average scores

### Review Interaction
- Like reviews (Light Up system)
- Reply to reviews
- View review timestamps and user info

### Admin Features
- Import servant data from Atlas Academy API
- Edit servant information
- Manage user content
- View statistics

## 🔧 Development

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Atlas Academy](https://atlasacademy.io/) for the FGO API
- [Supabase](https://supabase.com/) for backend infrastructure
- The Fate/Grand Order community

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ for the FGO community
