# Path Warden

**Report issues on UK public footpaths and rights of way — and actually get them fixed.**

🌐 **Live at [www.path-warden.com](https://www.path-warden.com)**

---

## The Problem

Found a blocked footpath, overgrown bridleway, or damaged stile? Reporting it to the right council is frustrating:
- Which council is responsible?
- What's their email address?
- How do you describe the location precisely?
- What should you actually say?

## The Solution

Path Warden handles all of this. Drop a pin on the map, describe the issue, and the app will:
1. **Identify the responsible council** using your coordinates
2. **Generate a professional email** citing the Highways Act 1980
3. **Send it directly** to the council's rights of way team
4. **Keep you updated** with a copy of the correspondence

## Features

- **Interactive Map** — Browse all reported issues across the UK on an OpenStreetMap-based interface
- **Flexible Location Input** — Click the map, enter an OS grid reference, paste coordinates, or drop a Google Maps link
- **Automatic Council Lookup** — Determines the responsible authority (county council, unitary authority, national park, etc.)
- **AI-Generated Emails** — Professional, legislation-aware emails generated via OpenAI
- **Photo Attachments** — Document issues with images that get attached to the council email
- **Anonymous Option** — Report without revealing your identity to the council
- **Issue Tracking** — Follow your reports from submission through to resolution

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Mapping**: Ordnance Survey Maps API / Leaflet
- **LLM**: OpenAI API
- **Email**: Resend
- **Styling**: Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Resend API key
- (Optional) Ordnance Survey API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
NEXT_PUBLIC_OS_API_KEY=your-os-api-key
OPENAI_API_KEY=your-openai-api-key
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=path-warden@yourdomain.com
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the database schema in the Supabase SQL Editor:
   - Open `supabase/schema.sql`
   - Copy the contents and run it in your Supabase SQL Editor

3. Create a storage bucket for photos:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `issue-photos`
   - Set it to public access

### API Keys

**Supabase**
- Create a project at [supabase.com](https://supabase.com)
- Find your API keys in Project Settings > API

**Ordnance Survey** (optional, falls back to OpenStreetMap)
- Register at [osdatahub.os.uk](https://osdatahub.os.uk/)
- Create a project and get an API key for the Maps API

**OpenAI**
- Get an API key from [platform.openai.com](https://platform.openai.com/)

**Resend**
- Sign up at [resend.com](https://resend.com/)
- Verify your domain for email sending
- Get your API key

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Create an account** at [www.path-warden.com](https://www.path-warden.com)
2. **Report an issue** — select the type (erosion, overgrowth, blocked path, etc.), describe it, and set the location
3. **Add photos** (optional) to document the problem
4. **Choose attribution** — include your name or report anonymously
5. **Preview the email** — review the AI-generated message and edit if needed
6. **Send** — the email goes directly to the council; you get a copy

You can track all your submissions and browse issues reported by others on the map.

## Supported Issue Types

- Path erosion
- Overgrowth / vegetation
- Blocked path
- Damaged or missing signs
- Flooding / waterlogging
- Dangerous road crossing
- Missing waymarks
- Damaged stiles, gates, or fences
- Path poorly defined
- Other

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   └── issues/            # Issue pages
├── components/            # React components
│   ├── Auth/              # Auth provider
│   ├── IssueForm/         # Form components
│   └── Map/               # Map components
├── lib/                   # Utility libraries
│   ├── supabase/          # Supabase clients
│   ├── grid-reference.ts  # Grid ref conversion
│   ├── mapit.ts           # Council lookup
│   ├── openai.ts          # Email generation
│   └── resend.ts          # Email sending
└── types/                 # TypeScript types
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
