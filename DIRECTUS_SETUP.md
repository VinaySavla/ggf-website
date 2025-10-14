# Directus Setup Guide for GGF Website

This guide will help you set up Directus as the backend CMS for the GGF website.

## Quick Start

### Option 1: Directus Cloud (Recommended)
1. Sign up at [https://directus.cloud](https://directus.cloud)
2. Create a new project
3. Note your project URL and token
4. Follow the collections setup below

### Option 2: Self-Hosted
1. Install Directus locally:
   ```bash
   npx create-directus-project ggf-directus
   cd ggf-directus
   npm start
   ```
2. Access at http://localhost:8055
3. Follow the collections setup below

## Collections Setup

### 1. Events Collection

**Collection Name**: `events`

**Fields**:
| Field Name | Type | Options |
|------------|------|---------|
| id | UUID | Primary Key, Auto-generated |
| title | String | Required |
| slug | String | Required, Unique |
| description | Text | Required |
| full_description | WYSIWYG | Optional |
| date | DateTime | Required |
| location | String | Optional |
| category | Dropdown | Options: Sports, Education, Games, Medical, Environment, Fellowship |
| status | Dropdown | Options: Upcoming, Ongoing, Completed. Default: Upcoming |
| date_created | DateTime | Auto-generated |
| date_updated | DateTime | Auto-updated |

**Permissions**: 
- Public: Read access
- Admin: Full access

### 2. Sponsors Collection

**Collection Name**: `sponsors`

**Fields**:
| Field Name | Type | Options |
|------------|------|---------|
| id | UUID | Primary Key, Auto-generated |
| name | String | Required |
| photo | Image | Optional, Store in /sponsors folder |
| description | Text | Optional |
| contribution | Dropdown | Options: Gold, Silver, Bronze |
| contribution_amount | Integer | Optional |
| date_created | DateTime | Auto-generated |
| sort | Sort | For manual ordering |

**Permissions**: 
- Public: Read access
- Admin: Full access

### 3. Players Collection

**Collection Name**: `players`

**Fields**:
| Field Name | Type | Options |
|------------|------|---------|
| id | Integer | Primary Key, Auto-increment, Manual Input Allowed |
| name | String | Required |
| age | Integer | Required, Min: 1, Max: 65 |
| role | Dropdown | Options: Batsman, Bowler, All-rounder, Wicket-keeper |
| photo | Image | Optional, Store in /players folder |
| status | Dropdown | Options: Available, Sold, Unsold. Default: Available |
| email | String | Required, Unique |
| phone | String | Required |
| address | Text | Optional |
| batting_style | String | Optional |
| bowling_style | String | Optional |
| base_price | Integer | Default: 1000 (points) |
| sold_price | Integer | Optional (filled when sold) |
| team_id | Many-to-One | Relation to teams collection |
| auction_order | Integer | Optional (set during random draw) |
| date_created | DateTime | Auto-generated |

**Permissions**: 
- Public: Read access, Create (for registration)
- Admin: Full access

### 4. Registrations Collection

**Collection Name**: `registrations`

**Fields**:
| Field Name | Type | Options |
|------------|------|---------|
| id | UUID | Primary Key, Auto-generated |
| name | String | Required |
| email | String | Required |
| phone | String | Required |
| age | Integer | Optional |
| role | String | Optional |
| address | Text | Optional |
| event_id | Many-to-One | Optional, Relation to events |
| date_created | DateTime | Auto-generated |

**Permissions**: 
- Public: Create access only
- Admin: Full access

### 5. Teams Collection

**Collection Name**: `teams`

**Fields**:
| Field Name | Type | Options |
|------------|------|---------|
| id | Integer | Primary Key, Auto-increment |
| name | String | Required, Unique |
| logo | Image | Optional, Store in /teams folder |
| owner_name | String | Optional |
| total_points | Integer | Default: 200000 |
| points_used | Integer | Default: 0, Calculated field |
| points_remaining | Integer | Default: 200000, Calculated field |
| max_players | Integer | Default: 12 |
| players_acquired | Integer | Default: 0, Calculated field |
| players | One-to-Many | Relation to players collection |
| color_primary | String | Optional (hex color for team branding) |
| color_secondary | String | Optional |
| date_created | DateTime | Auto-generated |

**Permissions**: 
- Public: Read access
- Admin: Full access

### 6. Auction State Collection

**Collection Name**: `auction_state`

**Fields**:
| Field Name | Type | Options |
|------------|------|---------|
| id | Integer | Primary Key, Only 1 record should exist |
| current_player_id | Integer | Foreign key to players.id |
| current_player | Many-to-One | Relation to players collection |
| is_active | Boolean | Default: false |
| current_bid | Integer | Default: 1000 |
| bidding_team_id | Integer | Optional, current highest bidder |
| auction_status | Dropdown | Options: Not Started, In Progress, Player Sold, Player Unsold, Completed |
| last_updated | DateTime | Auto-updated |

**Permissions**: 
- Public: Read access
- Admin: Full access

## Setting Up Permissions

### For Public Role:

1. **Events**: 
   - Read: ✅ All
   - Create: ❌
   - Update: ❌
   - Delete: ❌

2. **Sponsors**: 
   - Read: ✅ All
   - Create: ❌
   - Update: ❌
   - Delete: ❌

3. **Players**: 
   - Read: ✅ All
   - Create: ✅ (for player registration)
   - Update: ❌
   - Delete: ❌

4. **Registrations**: 
   - Read: ❌
   - Create: ✅
   - Update: ❌
   - Delete: ❌

## Getting API Tokens

### Public Token (for website)
1. Go to Settings > Access Tokens
2. Create new token
3. Name: "Public Website Access"
4. Role: Public
5. Copy token to `.env.local` as `NEXT_PUBLIC_DIRECTUS_TOKEN`

### Admin Token (optional, for server-side)
1. Go to Settings > Access Tokens
2. Create new token
3. Name: "Admin Access"
4. Role: Administrator
5. Copy token to `.env.local` as `DIRECTUS_ADMIN_TOKEN`

## Sample Data

### Sample Event
```json
{
  "title": "Turf Cricket Tournament",
  "slug": "cricket-tournament",
  "description": "Annual cricket tournament with auction",
  "date": "2025-11-15T10:00:00",
  "location": "Godhra Sports Club",
  "category": "Sports",
  "status": "Upcoming"
}
```

### Sample Sponsor
```json
{
  "name": "Patel Industries",
  "description": "Supporting community development",
  "contribution": "Gold",
  "contribution_amount": 100000
}
```

### Sample Player
```json
{
  "name": "Rajesh Kumar",
  "age": 25,
  "role": "Batsman",
  "email": "rajesh@example.com",
  "phone": "+91 9876543210",
  "status": "Available",
  "batting_style": "Right-handed",
  "matches": 45,
  "runs": 1250
}
```

## Testing the API

### Test with cURL:
```bash
# Get all events
curl "https://your-directus-url.com/items/events" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all players
curl "https://your-directus-url.com/items/players" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a registration
curl -X POST "https://your-directus-url.com/items/registrations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"1234567890"}'
```

## Troubleshooting

### CORS Issues
Add your Next.js domain to Directus CORS settings:
1. Go to Settings > Project Settings
2. Add `http://localhost:3000` (development)
3. Add your production domain

### Authentication Errors
- Verify token is correct
- Check token role has proper permissions
- Ensure token is not expired

### Image Upload Issues
- Check storage adapter configuration
- Verify folder permissions
- Ensure max file size is appropriate

## Next Steps

1. Create the collections as described above
2. Add sample data
3. Test API endpoints
4. Configure permissions
5. Update `.env.local` with your Directus URL and tokens
6. Start the Next.js app

## Resources

- [Directus Documentation](https://docs.directus.io)
- [Directus API Reference](https://docs.directus.io/reference/introduction.html)
- [Directus Cloud](https://directus.cloud)

---

Need help? Contact: info@ggfgodhra.com
