# Godhra Graduates Forum

A modern, full-featured community management platform for Godhra Graduates Forum (GGF) - organizing educational, sports, and fellowship events in collaboration with Godhra Sports Club.

## 🚀 Features

### Public Portal
- **Homepage**: Hero section, featured events, about GGF, statistics showcase
- **Events**: Browse all events, detailed event pages with custom registration forms
- **Gallery**: Photo collections organized by events/occasions
- **Member Workspace**: Dashboard, saved events, registration receipts/tickets, attendance, certificates and notifications
- **Community**: Opt-in directory, opportunities, mentorship, business directory and volunteering
- **Events**: Search/filter plus card and calendar views, waitlists, cancellations and feedback
- **Authentication**: Password or one-time email-code login, password reset, inactive-account enforcement and throttling

### Admin Panel
- **Dashboard**: Overview statistics (users, events, registrations)
- **Event Management**: Create/edit events with custom form builder (Google Forms-like)
- **Registration Management**: View, approve, export registrations with payment tracking
- **Team Management**: Create teams, manage rosters with auction pricing
- **User Management**: View all users, user profiles, create organizers (Super Admin)
- **Gallery Management**: Create collections, upload/manage photos (Super Admin)
- **User Stats**: Track and record player statistics (Super Admin)
- **Sports Management**: Manage sports categories (Super Admin)
- **Role-Based Access**: Member, event organizer, event-scoped finance reviewer and super-admin permissions
- **Community Operations**: Announcements, event reminders, QR check-in, certificates and volunteer review
- **Tournament Operations**: Teams, rosters, fixtures, results, standings and configurable stat definitions

### Key Capabilities
- **Custom Form Builder**: Dynamic registration forms with mandatory fields (name, email, mobile, gender, profile image)
- **Manual Payments**: UPI details, proof upload, explicit review status/rejection reason and provider-neutral metadata for a future gateway
- **Registration Limits**: Gender-based or common registration caps
- **Rich Text Editor**: WYSIWYG event descriptions
- **File Uploads**: Signature-validated files stored outside the public web root and served through access checks
- **Responsive Design**: Mobile-first, fully responsive across all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js v5 (NextAuth)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Rich Text**: react-quill-new
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Language**: JavaScript

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Modern web browser

## 🔧 Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd ggf-website
   npm install
   ```

2. **Set up environment variables**
   
   Create `.env` file:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/ggfdb"
   
   # Auth.js
   AUTH_SECRET="your-auth-secret-here"
   
   # Email
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM_EMAIL="GGF <noreply@ggfgodhra.com>"
   
   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   PAYMENT_PROVIDER="manual"
   FILE_STORAGE_PROVIDER="local"
   UPLOAD_DIR="./storage"
   SUPER_ADMIN_PASSWORD="use-a-long-unique-secret-for-initial-seeding"
   ```

3. **Set up the database**
   ```bash
   npm run db:migrate # Apply development migrations
   npm run db:seed    # Seed initial data (optional)
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ggf-website/
├── app/
│   ├── (admin)/                    # Admin route group
│   │   ├── admin/
│   │   │   ├── page.js             # Dashboard
│   │   │   ├── events/             # Event management
│   │   │   ├── registrations/      # Registration management
│   │   │   ├── teams/              # Team & roster management
│   │   │   ├── user/               # User profiles
│   │   │   ├── users/              # User creation (Super Admin)
│   │   │   ├── gallery/            # Gallery management (Super Admin)
│   │   │   ├── stats/              # User stats (Super Admin)
│   │   │   ├── sports/             # Sports management (Super Admin)
│   │   │   └── settings/           # Site settings
│   │   └── layout.js               # Admin layout with sidebar
│   ├── (public)/                   # Public route group
│   │   ├── page.js                 # Homepage
│   │   ├── events/                 # Event listing & details
│   │   ├── gallery/                # Public gallery
│   │   ├── about/                  # About page
│   │   ├── profile/                # User profile
│   │   ├── login/                  # Authentication
│   │   ├── register/               # User registration
│   │   └── user/[id]/              # Public user profiles
│   ├── api/                        # API routes
│   │   ├── auth/                   # Auth.js endpoints
│   │   └── upload/                 # File upload endpoint
│   ├── layout.js                   # Root layout
│   └── globals.css                 # Global styles
├── components/
│   ├── admin/                      # Admin components
│   │   ├── AdminSidebar.jsx        # Navigation sidebar
│   │   ├── EventForm.jsx           # Event form with form builder
│   │   ├── RosterManager.jsx       # Team roster management
│   │   ├── RichTextEditor.jsx      # WYSIWYG editor
│   │   └── ...
│   ├── public/                     # Public components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── HeroSection.jsx
│   │   ├── RegistrationForm.jsx
│   │   └── ...
│   └── Providers.jsx               # Context providers
├── actions/                        # Server actions
│   ├── auth.actions.js             # Authentication actions
│   ├── event.actions.js            # Event CRUD
│   ├── registration.actions.js     # Registration management
│   ├── team.actions.js             # Team & roster actions
│   ├── gallery.actions.js          # Gallery actions
│   └── ...
├── lib/
│   ├── auth.js                     # Auth.js configuration
│   ├── prisma.js                   # Prisma client
│   └── utils.js                    # Utility functions
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.js                     # Database seeder
└── storage/                        # Runtime upload volume (not committed or public)
```

## 🎨 Design System

### Colors
- **Primary**: `#6B1E9B` (Purple)
- **Accent**: `#D11F3F` (Red)

### Typography
- **Font**: Poppins (Google Fonts)

## 📊 Database Schema (Key Models)

### User & Authentication
- **User**: id, name, email, password, role (USER/ORGANIZER/FINANCE_REVIEWER/SUPER_ADMIN), mobile, village, gender
- **MasterPlayer**: User profile with playerId (YYYYMMDDhhmm0001 format), bio, photo, stats

### Events & Registrations
- **Event**: title, slug, description, type (General/Tournament), formSchema, registration settings
- **TournamentMaster**: Tournament-specific data linked to events
- **Registration**: Event registrations with userData (JSON), payment status

### Teams & Rosters
- **Team**: name, logo, gender, linked to tournament
- **TournamentRoster**: Player assignments to teams with auction price, role

### Gallery
- **GalleryCollection**: name, description, coverImage
- **GalleryImage**: url, caption, linked to collection

## 👥 User Roles

| Feature | Member | Finance reviewer | Organizer | Super Admin |
|---------|--------|------------------|-----------|-------------|
| Use portal and register | ✅ | ✅ | ✅ | ✅ |
| View own unified profile | ✅ | ✅ | ✅ | ✅ |
| Review assigned-event payments/refunds | ❌ | ✅ | ✅ (own events) | ✅ |
| Edit events | ❌ | ❌ | ✅ (own events) | ✅ |
| Manage users, gallery and settings | ❌ | ❌ | ❌ | ✅ |

`FINANCE_REVIEWER` is assigned automatically when an organizer grants an active member finance access on an event. It is deliberately event-scoped: the reviewer sees only registrations and refunds for assigned events and cannot edit an event. Removing their final assignment returns an ordinary member to the `USER` role.

## 📝 Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm test           # Run security and policy tests
npm run db:push    # Push Prisma schema to database
npm run db:migrate # Run database migrations
npm run db:seed    # Seed database
npm run db:studio  # Open Prisma Studio
```

## 🚀 Deployment

Apply checked-in migrations with `npx prisma migrate deploy` before starting the new application version. Back up the database first and do not use `db:push` for production releases. Mount `UPLOAD_DIR` as persistent storage; for more than one application instance, point the same storage boundary at a shared/object-storage adapter before scaling horizontally.

### Vercel (Recommended)
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Self-hosted
1. Build the project: `npm run build`
2. Set environment variables
3. Run: `npm start`

## 📧 Contact

- **Organization**: Godhra Graduates Forum

---

Built with ❤️ for Godhra Graduates Forum
