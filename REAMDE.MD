Build a complete MVP responsive web app called “Lebz Map”.

Important language requirement:
- The entire app UI must be in French
- All labels, buttons, navigation, placeholders, validation messages, and page titles must be written in French
- Only code, variable names, and technical identifiers can remain in English
- The term “lebz” must be used consistently in the French UI

Concept:
Lebz Map is a private travel map app for a very small group of friends (around 10 users max). Users can log travel proof points called “lebz” on a world map. Each lebz represents a place they have been and must include a photo. A lebz can also include a title, a description, and a rating out of 5.

Users can have multiple lebz in the same country. However, only the first lebz created by a given user in a given country should validate that country for that user. Additional lebz in the same country must still be saved and displayed, but they must not create additional country validations.

Tech stack:
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase for auth, database, and photo storage
- Leaflet for the map

General requirements:
- Mobile-first responsive web app
- Modern dark UI
- Clean, simple, playful interface
- Easy to deploy
- No paid services required
- Keep the architecture simple and maintainable
- No overengineering

Core features:

1. Authentication
- Email/password sign up and login with Supabase
- Authenticated users can access the app
- All authentication screens and messages must be in French

2. Main world map
- The main screen is a world map
- Display all users’ lebz as markers
- Clicking a marker opens a popup/card showing:
  - photo
  - lebz title
  - username
  - city
  - country
  - visited date
  - rating out of 5
  - description

3. Add a lebz
Users can create a new lebz with:
- latitude
- longitude
- required photo
- required title
- optional description
- required rating from 1 to 5
- visited date
- detected city
- detected country

The user can:
- use current geolocation
- or place the marker manually on the map

Requirements:
- photo upload is required
- store photos in Supabase Storage
- save all lebz in the database
- detect city and country from coordinates if possible
- if reverse geocoding is not fully implemented yet, keep the code structured for easy future integration
- city and country should be stored separately when possible

4. Country validation logic
This rule is very important:
- a user can have multiple lebz in the same country
- only the earliest lebz for that user in that country validates the country
- all other lebz in the same country are regular lebz and must still appear in the app
- validated countries must be computed correctly without duplicates

Example:
- a user creates 3 lebz in France
- only the first France lebz validates France
- the validated countries count for France remains 1

5. User profile
Each user has a profile page showing:
- username
- total number of lebz
- total number of validated countries
- list of validated countries
- list or gallery of all their lebz
- stats section

For each lebz on the profile, show:
- photo
- title
- city
- country
- rating
- visited date
- description

6. Community view
- All authenticated users can see all users’ lebz
- Add a leaderboard ranked by number of validated countries
- Add a users page showing each user’s stats

7. Database schema
Create a clean Supabase schema with at least these tables:

profiles:
- id
- username
- avatar_url
- created_at

lebz:
- id
- user_id
- latitude
- longitude
- city_name
- country_code
- country_name
- photo_url
- title
- description
- rating
- visited_at
- created_at

Important business logic:
- country validation should be derived from the first lebz per user per country
- do not create duplicate country validations
- keep all lebz records

You may compute validated countries using:
- a SQL view
- a query
- or frontend aggregation if needed for MVP

Choose the simplest robust solution, but prefer a reusable SQL view or query if practical.

8. RLS policies
Use Supabase Row Level Security:
- authenticated users can read all profiles
- authenticated users can read all lebz
- users can only insert/update/delete their own lebz
- users can only update their own profile

9. Pages / screens
Create these pages:
- Connexion / Inscription
- Carte principale
- Ajouter une lebz (page or modal)
- Profil utilisateur
- Classement / Utilisateurs

10. UI / UX
The UI must be in French and use the word “lebz” consistently.

Examples of French UI copy:
- Ajouter une lebz
- Mes lebz
- Dernières lebz
- Pays validés
- Classement des lebz
- Ville
- Pays
- Description
- Note
- Date de visite

Style:
- dark mode
- clean and fun
- rounded cards
- polished mobile-first layout
- easy navigation

11. Important constraints
- Keep the MVP intentionally small
- Do not add chat, comments between users, likes, notifications, or complex admin tools
- Do not overengineer the backend
- Use Supabase as much as possible
- Keep code modular and readable
- Include environment variable placeholders
- Include SQL schema and RLS policies
- Include a README with setup instructions
- The README can be in English, but the app itself must be in French

12. Nice-to-have if easy
- filter map markers by user
- country flags in profile and leaderboard
- users can edit or delete their own lebz
- simple client-side image compression before upload
- badge or label showing whether a lebz is the one that validated the country

13. Deliverable
Generate a working MVP codebase for “Lebz Map” with:
- frontend pages
- Supabase integration
- auth flow
- SQL schema
- RLS policies
- map with markers
- add lebz flow
- photo upload
- profile page
- leaderboard
- validated country computation based on the first lebz per country per user

Important naming rules:
- Project name: Lebz Map
- Each travel point is called a “lebz”
- Use clean and consistent naming throughout the codebase
- Prioritize functionality over advanced polish
- Deliver a working MVP, not just a mockup


-------------------------------------



Important implementation details:
- The app UI must be fully in French
- Each lebz should display both the city and the country
- Store city_name and country_name separately in the database
- If reverse geocoding is incomplete, keep a clear placeholder implementation and make the app still functional
- Validated countries must be based only on the first lebz per country per user