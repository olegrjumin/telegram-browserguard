# telegram-browserguard

A security-focused Telegram bot that analyzes shared links and generates comprehensive security reports.

## Architecture Overview

The project is split into three main services:

1. Telegram Bot Service
2. Analysis API Service
3. Telegram Mini App (Report UI)

## Telegram Bot Service

Node.js / Telegraf (Telegram Bot Framework) / Express.js / TypeScript

Key Features:

- Message handling with polling
- URL extraction:
  - multiple urls in a single message will be processed one by one
  - markdown links extraction
  - with or without protocol or www
- Simple rate limiting per user
- Queued processing of requests
- Inline query support
- Mini App integration for detailed reports

Missing features:

- telegram webhooks for production
- proper rate limiting with a database
- proper group chat support

## Analysis API Service

Node.js/TypeScript / OpenAI API / Express.js / Axios / DNS libraries, etc

Key Features:

- SSL certificate validation
- DNS analysis and records verification
- Domain age verification (WHOIS + DNS fallback)
- Wildcard usage check
- Http Redirect chain analysis
- IP geolocation checks
- AI Content analysis
- AI Trust scoring system
- Security report generation
- Storage of reports in a vercel blob storage (screenshot + report) with a hourly cleanup
- Screenshot service with puppeteer
  - optimized web page rendering
  - request interception for blocking unwanted resources
  - loading state detection

Missing features:

- S3 bucket storage for reports, currently using vercel blob storage with free tier limitations. Due to this cleanup is done hourly with a cron job.
- More optimized screenshot service handling complex scenarios (cookie banners, popups, etc)
- Google Safe Browsing API integration
- JavaScript redirects / Meta refresh redirects / Client-side routing redirects
- Phishing detection algorithms. Phishing databases integration
- Caching for recent scans

## Telegram Mini App (Report UI)

React / Tailwind / Telegram Web App SDK / TypeScript / Vite

Key Features:

- Security report visualization mobile / desktop

Missing features:

- deployed to github pages, should be deployed to ec2 + ssl certificate.
- list of recent reports
- report sharing / export
- ability to request a new report for a given URL within the app

## AI Scoring System

### 1. Data Collection

Aggregates data from:

- Redirect analysis
- DNS configuration
- Domain age
- SSL certificates

### 2. Risk Assessment Criteria

#### Domain Age

- < 1 month: HIGH risk
- 1-6 months: MEDIUM risk
- more than 6 months: LOW risk

#### SSL Certificates

- EV/OV: LOW risk
- DV (Let's Encrypt): MEDIUM-LOW risk
- Self-signed/Expired: HIGH risk

#### Security Checks

**Authentication**

- Valid SSL + Trusted CA
- Domain age > 6 months
- Proper DNS config
- Clean redirects

**DNS & Redirects**

- Email security (SPF/DMARC)
- Security TXT records
- Hosting location
- Redirect patterns (HTTP→HTTPS, CDNs)

### 3. Score Generation

OpenAI model returns:

- Risk score (0-100)
- Risk level (LOW/MEDIUM/HIGH)
- Findings & red flags
- Trust indicators
- Recommendations

### 4. Validation & Fallback

- Validates score range and risk levels
- Default fallback if analysis fails:
  - Score: -1
  - Risk: MEDIUM
  - Generic recommendations
  - Basic technical details

### Infrastructure

- Docker Compose for service orchestration
- EC2 deployment (deploy.sh script)

### Data Flow

- User sends link to Telegram bot
- Bot validates URL and checks rate limits
- Analysis service performs security checks
- Screenshot service captures visual representation
- Results combined into unified report
- Report stored in Vercel Blob Storage
- User receives report link and can preview report summary in Telegram
- Detailed report available via Mini App interface

### Future Improvements

- Location-based threats
- Reporters ranking and rewards
- Proper Phishing detection
- Interactive mode, where user can guess the score and risk
- User feedback loop. User can provide feedback on the report or app
- Options for user report scam / phishing urls themselves just by tagging or replying to the bot
- MB Products integrations (VPN, Antivirus, etc)
- More detailed report with more checks
- Speed improvements for the analysis service
- AI Agents integrations, where bot can follow the redirect or check some flow for the user.
- AI Fact checking, for the content
- i18n support (respond in multiple languages)
- Integration with other messaging platforms (Discord / Slack)
- Interactive scenarious (play-through) with bot for users to better understand the threats.
- Mini App improvements. Making it a full-fledged web app.
- Own phishing links database
- Robust Analytics

### Dependencies upgrade

- Caution do not upgrade express types to v5, use @types/express": "^4.17.21",

### Docker

Add .env root file and run, as in example
`docker-compose up -d`
