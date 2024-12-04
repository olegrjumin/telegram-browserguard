# Telegram mini app

# Local development

Use https://lokal.so/download/

Inside the `telegram-bot` set MINI_APP_URL to the tunnel URL

# Deployment

Set startParam inside `mockEnv.ts` to point to vercel blob json file for local development.
When inside the telegram environment url is passed inside `url-handlers.ts` via button
