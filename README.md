# Lebz Map

A private travel map app for a small group of friends to log and share travel points called "lebz" on a world map.

## Features

- **Authentication**: Email/password login and signup
- **Interactive World Map**: View all users' lebz on a Leaflet map
- **Add Lebz**: Create travel points with photos, titles, ratings, and descriptions
- **User Profiles**: View stats including total lebz and validated countries
- **Leaderboard**: Rank users by number of countries visited
- **Country Validation**: Only the first lebz in each country per user validates that country
- **Mobile-First Design**: Responsive dark UI optimized for mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Map**: Leaflet with react-leaflet
- **Backend**: Supabase (Auth, Database, Storage)
- **Routing**: React Router

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - The database schema has already been applied via migration
   - The `.env` file contains your Supabase credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Database Schema

### Tables

- **profiles**: User profiles with username and avatar
- **lebz**: Travel points with location, photo, rating, and metadata

### Views

- **validated_countries**: Computed view showing validated countries per user

### Storage

- **lebz-photos**: Public bucket for storing lebz photos

## Country Validation Logic

The app implements a specific business rule:
- Users can create multiple lebz in the same country
- Only the **first lebz** (earliest by creation date) in each country validates that country
- Additional lebz in the same country are displayed but don't count toward validated countries
- The `validated_countries` view handles this logic automatically

## UI Language

The entire user interface is in French, including:
- All labels, buttons, and navigation
- Form placeholders and validation messages
- Page titles and error messages
- The term "lebz" is used consistently throughout

## Pages

1. **/auth** - Login and signup
2. **/** - Main world map with all lebz
3. **/add** - Create a new lebz
4. **/profile** - View your profile and stats
5. **/profile/:userId** - View another user's profile
6. **/leaderboard** - Community leaderboard

## Key Features Implementation

### Photo Upload
- Required for each lebz
- Stored in Supabase Storage
- Public read access for all authenticated users

### Geolocation
- Users can use their current location
- Or manually select a location on the map
- Reverse geocoding via OpenStreetMap Nominatim API

### Map Markers
- Each lebz appears as a marker
- Clicking shows a popup with photo, title, user, location, rating, and description

### Profile Statistics
- Total number of lebz
- Number of validated countries
- List of validated countries
- Gallery of all user's lebz

## Security

Row Level Security (RLS) policies:
- All authenticated users can read profiles and lebz
- Users can only create, update, and delete their own lebz
- Users can only update their own profile

## Development Notes

- Built as an MVP - intentionally simple and focused
- No chat, comments, or complex social features
- Mobile-first responsive design
- Dark mode UI throughout
- Clean, maintainable code structure
