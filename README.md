# Godhra Graduates Forum (GGF) WebsiteThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).



A modern, responsive website for Godhra Graduates Forum - a community trust organizing educational, sports, and fellowship events in collaboration with Godhra Sports Club.## Getting Started



## 🚀 FeaturesFirst, run the development server:



- **Homepage**: Hero section, sponsors carousel, about GGF, upcoming events```bash

- **Cricket Tournament**: Player registration, auction countdown, player profilesnpm run dev

- **Events**: Browse all events, detailed event pages, registration forms# or

- **Sponsors**: Sponsor showcase and sponsorship informationyarn dev

- **Directus Integration**: CMS backend for dynamic content management# or

- **Responsive Design**: Mobile-first, fully responsive across all devicespnpm dev

- **Modern UI**: Built with Tailwind CSS, clean and accessible# or

bun dev

## 🛠️ Tech Stack```



- **Framework**: Next.js 15 (App Router)Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Styling**: Tailwind CSS

- **Language**: JavaScript (no TypeScript)You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

- **API Client**: Axios

- **CMS**: DirectusThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- **Fonts**: Poppins (Google Fonts)

## Learn More

## 📋 Prerequisites

To learn more about Next.js, take a look at the following resources:

- Node.js 18+ and npm

- Directus instance (local or cloud)- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- Modern web browser- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.



## 🔧 InstallationYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!



1. **Install dependencies**## Deploy on Vercel

   ```bash

   npm installThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

   ```

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

2. **Set up environment variables**
   
   Update `.env.local`:
   ```env
   NEXT_PUBLIC_DIRECTUS_URL=https://your-directus-instance.com
   NEXT_PUBLIC_DIRECTUS_TOKEN=your-directus-token-here
   DIRECTUS_ADMIN_TOKEN=your-admin-token-here
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ggf-website/
├── app/
│   ├── layout.js              # Root layout with Navbar & Footer
│   ├── page.js                # Homepage
│   ├── tournament/
│   │   ├── page.js            # Tournament overview
│   │   └── players/
│   │       ├── page.js        # All players
│   │       └── [id]/page.js   # Player profile
│   ├── events/
│   │   ├── page.js            # All events
│   │   └── [slug]/page.js     # Event details
│   └── sponsors/
│       └── page.js            # Sponsors page
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── HeroSection.jsx
│   ├── SponsorCarousel.jsx
│   ├── EventCard.jsx
│   ├── PlayerCard.jsx
│   ├── RegistrationForm.jsx
│   └── UpcomingEvents.jsx
├── lib/
│   └── directus.js            # Directus API utilities
└── public/
    ├── sponsors/              # Sponsor photos
    └── players/               # Player photos
```

## 🎨 Design System

### Colors
- **Primary**: `#6B1E9B` (Purple)
- **Accent**: `#D11F3F` (Red)

### Typography
- **Font**: Poppins (Google Fonts)

## 📊 Directus Collections

### 1. Events Collection
```
Fields:
- id (auto)
- title (string)
- slug (string, unique)
- description (text)
- date (datetime)
- location (string)
- category (dropdown: Sports, Education, Games, Medical, Environment, Fellowship)
```

### 2. Sponsors Collection
```
Fields:
- id (auto)
- name (string)
- photo (image)
- description (text)
- contribution (dropdown: Gold, Silver, Bronze)
- contribution_amount (integer)
```

### 3. Players Collection
```
Fields:
- id (auto)
- name (string)
- age (integer)
- role (dropdown: Batsman, Bowler, All-rounder, Wicket-keeper)
- photo (image)
- status (dropdown: Available, Sold)
- email (string)
- phone (string)
- address (text)
```

### 4. Registrations Collection
```
Fields:
- id (auto)
- name (string)
- email (string)
- phone (string)
- age (integer)
- address (text)
- date_created (datetime, auto)
```

## 🚀 Deployment

### Vercel
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
```

## 📧 Contact

- **Email**: info@ggfgodhra.com
- **Phone**: +91 9876543210
- **Location**: Godhra, Gujarat, India

---

Built with ❤️ for Godhra Graduates Forum
