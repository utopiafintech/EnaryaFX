# Enarya FX backend (AWS serverless)

```
Browser ──► CloudFront ──► S3                 (static site: index.html)
   │
   └──────► API Gateway (HTTP API) ──► Lambda ──► DynamoDB
                 │  JWT check (Cognito)             ▲
                 │                                  │
EventBridge Scheduler (hourly) ─► fetchRates ───────┤  (caches rates)
                               └► checkAlerts ──► SES email
```

| Component | AWS service | Code |
|---|---|---|
| Rates cache (hourly fetch) | Lambda + EventBridge Scheduler | `src/fetchRates.js` |
| `GET /rates` (public) | API Gateway + Lambda | `src/getRates.js` |
| `GET /news` (public, placeholder) | API Gateway + Lambda | `src/getNews.js` |
| Accounts / login | Cognito (hosted login page) | `template.yaml` |
| `GET/PUT /watchlist` (signed in) | API Gateway + Lambda | `src/watchlist.js` |
| `GET/POST/DELETE /alerts` (signed in) | API Gateway + Lambda | `src/alerts.js` |
| Price-alert emails (hourly) | Lambda + SES | `src/checkAlerts.js` |
| Data | DynamoDB (one table, on-demand) | `src/lib/db.js` |
| Website hosting | S3 + CloudFront | `template.yaml` |

Visitors never call the rates provider. The scheduled function fetches once and every page load reads the cached copy, so your provider quota and any API key stay safe.

## Prerequisites

- An AWS account, the [AWS CLI](https://docs.aws.amazon.com/cli/) configured (`aws configure`), and the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
- Node.js 22+ (Lambda runs Node.js 24).
- A **verified sender email in Amazon SES** (SES console → Verified identities). New SES accounts are in the *sandbox*, where you can only email addresses you have also verified. Request production access before real users sign up.

## Deploy

```bash
cd backend
npm test                      # unit tests for the logic
sam validate --lint
sam build
sam deploy --guided           # first time; answer the prompts
```

Parameters you will be asked for:

- `AlertFromEmail`: your verified SES sender.
- `SiteOrigin`: the site origin allowed by CORS, e.g. `https://utopiafintech.github.io` (no path, no trailing slash). Change it to your CloudFront URL if you host the site on AWS.
- `CallbackUrl`: the full page URL users return to after login, e.g. `https://utopiafintech.github.io/EnaryaFX/`.

After deploying, note the stack **Outputs** (`ApiUrl`, `HostedUiDomain`, `UserPoolClientId`, `SiteBucketName`, `SiteUrl`, `CloudFrontDistributionId`).

First run: the rates table is empty until the hourly schedule fires. Trigger it once:

```bash
aws lambda invoke --function-name $(aws cloudformation describe-stack-resources \
  --stack-name <your-stack> --query "StackResources[?LogicalResourceId=='FetchRatesFunction'].PhysicalResourceId" \
  --output text) /dev/stdout
```

Then check `curl <ApiUrl>/rates`.

## Connect the website

1. In `index.html`, set `API_BASE` to the `ApiUrl` output (no trailing slash).
2. To host on AWS instead of GitHub Pages:

```bash
aws s3 cp ../index.html s3://<SiteBucketName>/index.html
aws cloudfront create-invalidation --distribution-id <CloudFrontDistributionId> --paths "/*"
```

   then set the `SiteOrigin` and `CallbackUrl` parameters to the `SiteUrl` and redeploy.

If `API_BASE` is empty, or the API is unreachable, the site falls back to calling Frankfurter directly, so nothing breaks.

## Using the signed-in endpoints

Send the Cognito **ID token** as `Authorization: Bearer <token>`. Sign-in uses the Cognito hosted page at `HostedUiDomain` (authorization code flow, client = `UserPoolClientId`). The login/watchlist/alerts screens in the website are the next step; the API for them is ready.

## Cost and safety notes

- Everything here is pay-per-use. Set a billing alarm in AWS Budgets before you deploy.
- `checkAlerts` uses a table Scan, which is fine at small scale. Add a global secondary index if you reach many thousands of alerts.
- Alerts are limited to 10 per user and fire once.
- Educational information only, not financial advice.
