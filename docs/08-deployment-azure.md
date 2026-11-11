# Deployment: Azure App Service

## Target

| Item | Value |
|---|---|
| Platform | Azure App Service, Linux, Python (D-06) |
| Runtime | Python 3.12, the version CI tests (OQ-23) |
| Server | gunicorn |
| Startup command | `gunicorn --bind=0.0.0.0 --timeout 120 "app:create_app()"` |
| URL | https://classify.azurewebsites.net (the Azure default, OQ-06) |
| App | `classify` |
| Resource group | `classify-rg` (Central US) |
| Plan | `classify-plan`, Free (F1), Linux, **East US 2** (D-40) |
| Budget | `classify-budget`: $10 a month; emails the subscription Owner at 50% and 100% of actual spend and 100% of forecast |

First deployed on Nov 11, 2026 (#7).

To list supported Python versions:

```sh
az webapp list-runtimes --os linux -o table
```

On Nov 11, 2026 this listed Python 3.11 through 3.15.

### Region limits

The Azure for Students subscription has a policy, "Allowed resource deployment regions", that allows only `eastus`, `eastus2`, `centralus`, `northcentralus`, and `canadacentral`. Running `az webapp up` without `--location` picks some other region and fails with `RequestDisallowedByAzure`.

Within those regions, the subscription has no Free (F1) quota in `centralus` or `northcentralus` ("Current Limit (F1 VMs): 0"). `eastus2` worked. To check the policy again:

```sh
az policy assignment list --query "[].{name:displayName, params:parameters}" -o json
```

## Account

Azure for Students gives $100 of credit to use within 12 months, with no credit card. It renews yearly while you're a student and is only for full-time university students. After the credit runs out, Microsoft asks whether to move to pay-as-you-go. If you don't, the subscription and its products are disabled.

**Set a budget alert** in Azure Cost Management as soon as the subscription exists (NFR-10).

## Plan tier

Checked against Microsoft's pages on Nov 8, 2026. Recheck before relying on these.

| | Free (F1) | Basic (B1) |
|---|---|---|
| CPU time per day | 60 minutes | Unlimited, pay at standard rates |
| CPU time per 5 minutes | 3 minutes | Not listed |
| Compute | Shared | 1 core |
| Memory | 1 GB | 1.75 GB |
| Storage | 1 GB | 10 GB |
| Always On | Not available | Available |
| Custom domains per app | 0 (`azurewebsites.net` only) | 500 |
| Custom domain SSL | Not supported; `*.azurewebsites.net` certificate included | SNI SSL |
| Maximum instances | 1 shared | 3 dedicated |
| Price | Check current pricing | Check current pricing |

Sources: [App Service limits](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits), [App Service Linux pricing](https://azure.microsoft.com/en-us/pricing/details/app-service/linux/), [Azure for Students](https://azure.microsoft.com/en-us/free/students), [Python on App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-language-python).

**Team decision (D-36):** use the cheapest tier that runs the app within the student credit. Start on Free, and move to Basic if quotas are hit. The Free 60-minute and 3-minute CPU limits are the likeliest problem during a rush, and without Always On the app can go idle and start slowly.

## First-time setup

This was done on Nov 11, 2026. It's kept here in case the app ever has to be rebuilt. Don't use a bare `az webapp up`: it picks a disallowed region, and it zips the whole folder, including `.venv`.

1. Sign in: `az login`.
2. Create the resource group, the plan, and the app:
   ```sh
   az group create -n classify-rg -l centralus
   az appservice plan create -g classify-rg -n classify-plan --is-linux --sku F1 -l eastus2
   az webapp create -g classify-rg -p classify-plan -n classify --runtime "PYTHON:3.12"
   ```
3. Set the startup command:
   ```sh
   az webapp config set -g classify-rg -n classify \
     --startup-file 'gunicorn --bind=0.0.0.0 --timeout 120 "app:create_app()"'
   ```
4. Turn on the Oryx build, which installs `requirements.txt` during deploy:
   ```sh
   az webapp config appsettings set -g classify-rg -n classify --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
   ```
5. Enforce HTTPS, require TLS 1.2 or newer, and turn off FTP (NFR-05):
   ```sh
   az webapp update -g classify-rg -n classify --https-only true
   az webapp config set -g classify-rg -n classify --min-tls-version 1.2 --ftps-state Disabled
   ```
6. Create the budget alert (NFR-10). It emails the subscription Owner, so no address is needed. It was created with the Consumption budgets REST API (`az rest`, `api-version=2023-05-01`) for $10 a month from Nov 1, 2026 to Nov 1, 2027. To check it:
   ```sh
   az consumption budget show --budget-name classify-budget
   ```

## Deploy

### Manual (current)

From an up-to-date `main`. `git archive` zips only tracked files, so `.venv`, `.env`, and local files stay out:

```sh
git checkout main && git pull
ruff check . && pytest && python scripts/validate_data.py
git archive --format=zip -o /tmp/classify.zip main
az webapp deploy -g classify-rg -n classify --src-path /tmp/classify.zip --type zip
```

The deploy takes about a minute: Oryx builds, then the site restarts.

### GitHub Actions (off)

`.github/workflows/azure-deploy.yml` is disabled and runs only when started by hand. `AZURE_WEBAPP_NAME` is already set to `classify`. To enable it:

1. Turn on basic auth publishing credentials for the app. New apps have them off, and the publish profile needs them.
2. Download the publish profile from the Azure portal.
3. Save it as the `AZURE_WEBAPP_PUBLISH_PROFILE` repository secret.
4. Uncomment the `push` trigger.

The workflow runs lint, the format check, tests, data validation, and the JavaScript tests before it deploys.

## Configuration

Environment variables are documented in `.env.example`. On Azure, set them as application settings. No secrets belong in the repo (NFR-05), and the MVP needs none.

| Variable | Default | Purpose |
|---|---|---|
| `CLASSIFY_DATA_PATH` | `data/tcu_classes_spring27.json` | Term data |
| `CLASSIFY_META_PATH` | `data/term_meta.json` | Timestamp and source |
| `CLASSIFY_OVERRIDES_PATH` | `data/overrides.json` | Hand-entered data corrections |
| `CLASSIFY_SHOWCASE_PATH` | `data/instructors_showcase.json` | Showcase instructors |
| `FLASK_DEBUG` | `0` | Local debugging. Flask removed `FLASK_ENV` in version 2.3 |

## Check after deploying

1. `/api/health` returns 200.
2. `/api/meta` shows the expected term and `scraped_at`.
3. The home page shows the term, the timestamp, and the footer disclaimer.
4. `http://` redirects to `https://`, and `/api/sections` comes back gzip-compressed with the CSP, `X-Content-Type-Options`, and `Referrer-Policy` headers.

```sh
curl -s https://classify.azurewebsites.net/api/health
curl -s https://classify.azurewebsites.net/api/meta
```

On Nov 11, 2026, all of these passed. Health returned 200, meta showed Spring 2027 with 3,926 records, and the gzipped sections payload was about 112 KB.

## Domain

Use the Azure default for now. After launch, the team will work with TCU on `classify.tcu.edu`, or on Classify taking over `classes.tcu.edu` (D-38). `tcu.com` isn't ours. A custom domain requires leaving the Free tier.
