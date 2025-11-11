# Autumn

![Autumn](assets/github_hero.png)

[![Discord](https://img.shields.io/badge/Join%20Community-5865F2?logo=discord&logoColor=white)](https://discord.gg/53emPtY9tA)
[![Follow](https://img.shields.io/twitter/follow/autumnpricing?style=social)](https://x.com/autumnpricing)
[![Y Combinator](https://img.shields.io/badge/Y%20Combinator-F24-orange)](https://www.ycombinator.com/companies/autumn)
[![Cloud](https://img.shields.io/badge/Cloud-☁️-blue)](https://app.useautumn.com)
[![Documentation](https://img.shields.io/badge/Documentation-📕-blue)](https://docs.useautumn.com)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/useautumn/autumn)

[Autumn](https://useautumn.com) is an open-source layer between Stripe and your application, allowing you to create any pricing model and embed it with a couple lines of code. On Autumn you can build:
- Subscriptions
- Credit systems & top ups
- Usage-based models & overages
- Custom plans for large customers

All this without having to handle webhooks, upgrades/downgrades, cancellations or payment fails.


## Getting Started

**Cloud**: The quickest way to start using Autumn is through our [cloud service](https://app.useautumn.com). 

**Self Hosted**: If you'd like to self-host Autumn:

### Option 1: Docker (Recommended - Fully Containerized)

1. Make sure you have `bun` and `docker` installed
2. Install the project dependencies
```bash
bun install
```
3. Run our set up script:
```bash
bun setup
```
4. Start Autumn with Docker (includes PostgreSQL + automatic migrations):
```bash
docker compose -f docker-compose.dev.yml up -d
```

That's it! Everything runs automatically:
- ✅ PostgreSQL database (containerized)
- ✅ Database migrations (automatic)
- ✅ Frontend on `http://localhost:3000`
- ✅ Backend on `http://localhost:8080`

### Option 2: Local Development (Manual Database Setup)

If you prefer to use your own PostgreSQL instance:

1. Make sure you have `bun` installed
2. Install the project dependencies
```bash
bun install
```
3. Run our set up script:
```bash
bun setup
```
4. Generate the relevant tables in your postgres DB
```bash
bun db:generate && bun db:migrate
```
5. Run Autumn:
```bash
# For Windows
docker compose -f docker-compose.dev.yml up

# For mac/linux  
docker compose -f docker-compose.unix.yml up
```

### Custom Ports (Optional)

To use different ports, add these to your `server/.env`:
```env
FRONTEND_PORT=3001
BACKEND_PORT=8081
POSTGRES_PORT=5434
```

Then start with:
```bash
./docker-start.sh
```

> 📖 For detailed port configuration options, see [PORT_CONFIG.md](PORT_CONFIG.md)

### Access Your Application

- **Frontend**: `http://localhost:3000` (or your custom `FRONTEND_PORT`)
- **Backend**: `http://localhost:8080` (or your custom `BACKEND_PORT`)
- **Database**: `localhost:5433` (or your custom `POSTGRES_PORT`)

> ⚠️ To log in, enter an email at the sign in page, and an OTP should appear in your console / terminal. Normally, we use Resend to email an OTP or Google OAuth -- these can be set up by providing your credentials in `server/.env`

> ℹ️ Our set up script initializes the required env vars and (optionally) a Supabase instance. With Docker (Option 1), you get a containerized PostgreSQL automatically. For manual setup (Option 2), you can use your own Postgres instance by setting the `DATABASE_URL` in `server/.env`

## Troubleshooting

If you encounter a `SyntaxError: Unexpected end of JSON input` error when running `bun setup` again after previously running it, you may need to clear your database tables first. This is a [known issue](https://github.com/drizzle-team/drizzle-orm/issues/4529) that can occur when running database migrations multiple times.

To resolve this:

1. Connect to your database
2. Drop all existing tables
3. Run the setup script again:


## Why Autumn

**1️⃣ Billing infra gets complex fast**

More than payments: it's building permission management, metering, usage limits with cron jobs, and connecting it to upgrade, downgrade, cancellation and failed payments states. Race conditions, edge cases, and other bugs will slow you down.

**2️⃣ Billing and app logic should be decoupled**

Growing companies iterate on pricing often: raising prices, experimenting with credits or charging for a new feature. DB migrations, rebuilding in-app flows, internal dashboards for custom pricing and grandfathering users on old pricing is a nightmare.


## How it works
First, create your products and plans on the dashboard. We support **any** pricing model. Some popular ones we've seen include:

1. **Usage & Overage** ⚡: set real-time usage limits and choose when they reset. Charge users if they go over.
2. **Credits** 💰: users can access monetary or arbitrary credits that many features can draw from
3. **Seat-based with per-seat limits** 👥:: bill customers for their users (or other entities)
4. **Pay upfront** 💳: let users purchase a fixed quantity of a feature upfront, which is used over time


Next, all your billing logic can be implemented through just 3 functions:

1. `/attach`: One function call for all purchase flows. We return a Stripe Checkout URL, or handle an upgrade/downgrade.

```tsx
const { attach } = useAutumn();
<button
  onClick={async () => {
    await attach({ productId: "pro" });
  }}
>
  Upgrade to Pro
</button>
```

2. `/check`: Check whether a customer has access to a product, feature or remaining usage.
```ts
const { check } = useAutumn();

const { data } = await check({ featureId: "ai_tokens" })

!data.allowed && alert("AI limit reached")
```

3. `/track`: When a customer uses a usage-based feature, record a usage event.

```ts
const { track } = useAutumn();

await track({
  featureId: "ai_tokens",
  value: 1312
})
```

## Others

**Contributing** 🤝: If you're interested in contributing, you can check out our guide [here](/.github/CONTRIBUTING.md). All types of help are appreciated :)

**Support** 💬: If you need any type of support, we're typically most responsive on our [Discord channel](https://discord.gg/STqxY92zuS), but feel free to email us `hey@useautumn.com` too!



<!-- ## Congratulations!

You've embedded a full billing system into your application within a few minutes. You can make any pricing model changes you need, or handle custom plans without needing to alter your codebase.

Feel free to self-host Autumn, or use our hosted version at https://useautumn.com. And let us know any questions, thoughts or feedback at hey@useautumn.com. -->

## Contributors

Thanks to all our contributors for helping make autumn a better product!

<a href="https://github.com/useautumn/autumn/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=useautumn/autumn" />
</a>
