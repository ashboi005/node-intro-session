# Feedback App - Backend Server

## Content Moderation

This application uses a two-tier content moderation system:

### 1. Primary: OpenAI Moderation API (Recommended)
- **Comprehensive**: Detects a wide range of inappropriate content
- **Context-aware**: Understands context and intent
- **Multi-language**: Works with multiple languages
- **Up-to-date**: Continuously updated to handle new forms of inappropriate content

### 2. Fallback: Local Word Filter
- **Basic protection**: Simple word matching
- **Limited scope**: Only catches exact matches from predefined list
- **Used when**: OpenAI API is not available or configured

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure OpenAI (Recommended)

1. Get an OpenAI API key:
   - Visit https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key

2. Add the key to your `.env` file:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Database Setup

1. Configure your database URL in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/feedback_db?schema=public"
   ```

2. Set up the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### 4. Start the Server

```bash
npm run dev
```

## API Endpoints

- `POST /api/feedback` - Create new feedback
- `GET /api/feedback` - Get all feedback
- `GET /api/feedback/flagged` - Get only flagged feedback
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback
- `GET /api/feedback/stats` - Get feedback statistics
- `GET /health` - Health check

## Content Moderation Details

### OpenAI Moderation Categories
When OpenAI is configured, it can detect:
- Hate speech
- Harassment
- Self-harm content
- Sexual content
- Violence
- And more...

### Local Filter
The fallback system checks for common inappropriate words but is limited compared to OpenAI's capabilities.

## Security Features

- Rate limiting (10 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- IP-based submission limits
- Content moderation

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open database GUI
npm run db:studio
```
