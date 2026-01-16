# Path Warden

A web application for reporting issues on UK public footpaths, bridleways, and rights of way. Users can report problems like path erosion, overgrowth, damaged signs, and more. The app automatically generates and sends emails to the responsible local authority.

## Features

- **User Authentication**: Sign up and login via Supabase Auth
- **Issue Reporting**: Submit issues with descriptions, photos, and precise location
- **Interactive Map**: View all reported issues on an Ordnance Survey map (or OpenStreetMap fallback)
- **Location Input**: Click on map, enter grid reference, paste coordinates, or use Google Maps link
- **Automatic Council Detection**: Uses MapIt API to find the responsible local authority
- **AI-Generated Emails**: OpenAI generates professional emails to councils
- **Email Delivery**: Resend handles email delivery with optional CC to the reporter

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

2. Copy the environment template:

```bash
cp .env.local.example .env.local
```

3. Fill in your environment variables in `.env.local`:

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

## Usage

1. **Sign up/Login**: Create an account to report issues
2. **Report an Issue**: Click "Report Issue" and fill in the form
   - Select issue type
   - Describe the problem
   - Set location (click map, enter grid ref, paste coords, or use Maps link)
   - Upload photos (optional)
   - Choose anonymous or attributed submission
3. **Send to Council**: View your issue and click "Send to Council"
   - Review the AI-generated email
   - Edit if needed
   - Send (you'll be CC'd if not anonymous)
4. **Browse Issues**: View all reported issues on the map

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
