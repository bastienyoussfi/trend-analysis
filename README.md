# Social Trends Analyzer

An AI-powered social media trends analysis module built with NestJS. This module analyzes current trends across multiple social platforms, identifies what works, and provides actionable insights using AI (Anthropic Claude, OpenAI GPT, etc.).

## Features

- **AI Model Agnostic**: Easily switch between AI providers (Anthropic, OpenAI, etc.)
- **Multi-Platform Support**: Analyze trends from Twitter, Instagram, TikTok, LinkedIn, YouTube
- **Historical Analysis**: Track trend evolution over time
- **Actionable Insights**: Get recommendations on optimal posting times, hashtags, content formats
- **Caching**: Smart caching to reduce API costs
- **Webhook Support**: Get analysis results via webhook
- **RESTful API**: Clean, documented API endpoints

## Architecture

```
┌─────────────────────────────────────────┐
│      Social Trends Analyzer Module     │
├─────────────────────────────────────────┤
│  • AI Abstraction Layer (Swappable)    │
│  • Platform Strategies (Extensible)    │
│  • Insights Generator                   │
│  • Historical Analysis                  │
└─────────────────────────────────────────┘
```

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis (optional, falls back to in-memory)
- **AI Providers**: Anthropic Claude, OpenAI GPT
- **Package Manager**: pnpm

## Installation

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 13
- Redis (optional, for production caching)

### Setup

1. **Clone and install dependencies**

```bash
pnpm install
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required: At least one AI provider
ANTHROPIC_API_KEY=your_key_here
# OR
OPENAI_API_KEY=your_key_here

# Required: Database
DATABASE_HOST=localhost
DATABASE_PASSWORD=your_password

# Optional: Platform APIs (uses mock data if not configured)
TWITTER_BEARER_TOKEN=your_token
INSTAGRAM_USERNAME=your_username
```

3. **Set up database**

```bash
# Create database
createdb trends_analyzer

# The app will auto-sync tables in development mode
```

4. **Start the application**

```bash
# Development
pnpm start:dev

# Production
pnpm build
pnpm start:prod
```

The API will be available at `http://localhost:3000/api`

## Docker Setup (Recommended)

The easiest way to get started is using Docker and Docker Compose. This will automatically set up PostgreSQL, Redis, and the API.

### Prerequisites

- Docker >= 20.10
- Docker Compose >= 2.0

### Quick Start with Docker

1. **Clone the repository**

```bash
git clone <repository-url>
cd trend-analysis
```

2. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required: At least one AI provider
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Platform APIs
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
```

**Note**: For Docker, keep these settings in `.env`:
- `DATABASE_HOST=postgres`
- `REDIS_HOST=redis`
- `PORT=3002`

3. **Start all services**

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL** database on `localhost:5432`
- **Redis** cache on `localhost:6379`
- **API** application on `localhost:3002`

4. **Verify services are running**

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f api

# Test the API
curl http://localhost:3002/api/trends/health
```

5. **Stop services**

```bash
docker-compose down
```

To stop and remove all data (including database volumes):

```bash
docker-compose down -v
```

### Docker Commands

```bash
# Build and start services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart api

# Execute commands inside container
docker-compose exec api sh

# Rebuild the application
docker-compose build api
```

### Accessing Services

- **API**: http://localhost:3002/api
- **PostgreSQL**: `localhost:5432` (user: `postgres`, password: `postgres`, db: `trends_analyzer`)
- **Redis**: `localhost:6379`

### Development with Docker

To develop while using Docker for databases only:

1. Start only the databases:

```bash
docker-compose up postgres redis -d
```

2. Update `.env` for local development:

```env
DATABASE_HOST=localhost
REDIS_HOST=localhost
PORT=3002
```

3. Run the app locally:

```bash
pnpm install
pnpm start:dev
```

## API Endpoints

### 1. Analyze Trends

Analyze a topic across multiple platforms with AI.

```bash
POST /api/trends/analyze
```

**Request Body:**

```json
{
  "topic": "AI",
  "platforms": ["twitter", "instagram"],
  "aiProvider": "anthropic",
  "useCache": true,
  "webhookUrl": "https://your-app.com/webhook"
}
```

**Response:**

```json
{
  "topic": "AI",
  "analysis": {
    "summary": "AI is trending heavily across platforms...",
    "sentiment": 0.85,
    "predictedGrowth": "rising",
    "confidence": 0.92
  },
  "insights": [
    {
      "type": "best_time",
      "title": "Optimal Posting Time for twitter",
      "description": "Best engagement on Tuesday at 14:00...",
      "confidence": 0.88,
      "actionable": true
    }
  ],
  "analyzedAt": "2024-01-15T14:30:00Z",
  "fromCache": false
}
```

### 2. Get Trending Topics

Get current trending topics from a platform.

```bash
GET /api/trends/trending?platform=twitter&limit=10
```

**Response:**

```json
{
  "platform": "twitter",
  "count": 10,
  "trends": [
    {
      "topic": "AI",
      "platform": "twitter",
      "volume": 50000,
      "score": 5.0,
      "detectedAt": "2024-01-15T14:00:00Z"
    }
  ]
}
```

### 3. Get Trend History

Analyze how a trend evolved over time.

```bash
GET /api/trends/history?topic=AI&platform=twitter&days=7
```

**Response:**

```json
{
  "topic": "AI",
  "platform": "twitter",
  "period": "7 days",
  "timeline": [
    { "date": "2024-01-08", "volume": 15000, "sentiment": 0.72 },
    { "date": "2024-01-09", "volume": 18000, "sentiment": 0.75 }
  ],
  "trend": "rising",
  "growthRate": 0.35
}
```

### 4. Health Check

```bash
GET /api/trends/health
```

## Usage Examples

### Basic Analysis

```typescript
// Using fetch
const response = await fetch('http://localhost:3000/api/trends/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Climate Change',
    platforms: ['twitter', 'instagram'],
    aiProvider: 'anthropic',
  }),
});

const analysis = await response.json();
console.log(analysis.insights);
```

### With Webhook

```typescript
// Analysis result will be sent to your webhook
await fetch('http://localhost:3000/api/trends/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    topic: 'Technology',
    platforms: ['twitter'],
    webhookUrl: 'https://your-app.com/webhook',
  }),
});
```

### Using as NestJS Module

```typescript
import { TrendsAnalyzerModule } from './trends-analyzer/trends-analyzer.module';

@Module({
  imports: [TrendsAnalyzerModule],
})
export class YourModule {}

// Inject the service
constructor(private trendsAnalyzer: TrendsAnalyzerService) {}

// Use it
const analysis = await this.trendsAnalyzer.analyzeTrends({
  topic: 'AI',
  platforms: [PlatformType.TWITTER],
});
```

## Switching AI Providers

The module is designed to be AI-agnostic. You can switch providers in three ways:

### 1. Change Default Provider (Environment)

```env
AI_DEFAULT_PROVIDER=openai  # or 'anthropic'
```

### 2. Per-Request

```json
{
  "topic": "AI",
  "platforms": ["twitter"],
  "aiProvider": "openai"
}
```

### 3. Add New Provider

```typescript
// 1. Create adapter
@Injectable()
export class GoogleAIAdapter implements AIProvider {
  async analyzeContent(prompt: string) {
    // Implementation
  }
  // ... other methods
}

// 2. Register in module
{
  provide: 'AI_PROVIDERS',
  useFactory: (anthropic, openai, google) => [anthropic, openai, google],
  inject: [AnthropicAdapter, OpenAIAdapter, GoogleAIAdapter],
}
```

## Adding New Platforms

```typescript
// 1. Create strategy
@Injectable()
export class TikTokStrategy implements PlatformStrategy {
  async fetchTrendingTopics(limit?: number) {
    // Implementation
  }
  // ... other methods
}

// 2. Register in module
{
  provide: 'PLATFORM_STRATEGIES',
  useFactory: (twitter, instagram, tiktok) => [twitter, instagram, tiktok],
  inject: [TwitterStrategy, InstagramStrategy, TikTokStrategy],
}
```

## Database Schema

The module uses PostgreSQL with the following main tables:

- **trends**: Trending topics detected across platforms
- **analyses**: AI analysis results
- **platform_posts**: Sample posts from platforms
- **insights**: Generated actionable insights

All tables auto-sync in development mode.

## Caching Strategy

1. **Redis** (recommended for production): Set `REDIS_ENABLED=true`
2. **In-Memory** (development): Default if Redis not configured

Cached data includes:
- Recent analyses (1 hour TTL)
- Trending topics (15 min TTL)
- Platform data (30 min TTL)

## Development

```bash
# Run in watch mode
pnpm start:dev

# Run linter
pnpm lint

# Format code
pnpm format

# Build
pnpm build
```

## Project Structure

```
src/
├── config/                    # Configuration files
│   ├── app.config.ts
│   ├── database.config.ts
│   └── cache.config.ts
├── trends-analyzer/           # Main module
│   ├── ai/                    # AI abstraction layer
│   │   ├── interfaces/
│   │   ├── adapters/          # AI provider adapters
│   │   └── ai-factory.service.ts
│   ├── platforms/             # Platform strategies
│   │   ├── interfaces/
│   │   ├── strategies/        # Platform implementations
│   │   └── platform-factory.service.ts
│   ├── entities/              # Database entities
│   ├── dto/                   # Data transfer objects
│   ├── services/              # Business logic
│   └── controllers/           # API endpoints
└── main.ts                    # Application entry
```

## Key Design Patterns

- **Strategy Pattern**: Platform-specific implementations
- **Adapter Pattern**: AI provider abstraction
- **Factory Pattern**: Dynamic provider selection
- **Repository Pattern**: Data access abstraction
- **Dependency Injection**: NestJS IoC container

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using NestJS and AI
