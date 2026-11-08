# Deployment: Azure App Service

## Target

| Item | Value |
|---|---|
| Platform | Azure App Service, Linux, Python (D-06) |
| Runtime | Python 3.12, or newer if supported. Confirm first (below, OQ-23) |
| Server | gunicorn |
| Startup command | `gunicorn --bind=0.0.0.0 --timeout 120 "app:create_app()"` |
| URL | The Azure default, `*.azurewebsites.net` (OQ-06) |

Microsoft's Python page doesn't name a newest version. It tells you to list what's supported:

```sh
az webapp list-runtimes --os linux | grep PYTHON
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

**Recommendation:** start on Free. Move to Basic before registration-day traffic if quotas are hit (OQ-08). The Free 60-minute and 3-minute CPU limits are the likeliest problem during a rush, and without Always On the app can go idle and start slowly.

## First-time setup

1. Sign in: `az login`.
2. Create the app from the repo root. Replace the placeholders:
   ```sh
   az webapp up --name <app-name> --resource-group <resource-group> --runtime "PYTHON:3.12" --sku F1
   ```
3. Set the startup command:
   ```sh
   az webapp config set --resource-group <resource-group> --name <app-name> \
     --startup-file 'gunicorn --bind=0.0.0.0 --timeout 120 "app:create_app()"'
   ```
4. Turn on the Oryx build and set app settings:
   ```sh
   az webapp config appsettings set --resource-group <resource-group> --name <app-name> \
     --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
   ```
5. Enforce HTTPS (NFR-05):
   ```sh
   az webapp update --resource-group <resource-group> --name <app-name> --https-only true
   ```

## Deploy

### GitHub Actions

`.github/workflows/azure-deploy.yml` is disabled and runs only when started by hand. To enable it:

1. Download the publish profile from the Azure portal.
2. Save it as the `AZURE_WEBAPP_PUBLISH_PROFILE` repository secret.
3. Set `AZURE_WEBAPP_NAME` in the workflow.
4. Uncomment the `push` trigger.

The workflow runs lint, tests, and data validation before it deploys.

### Manual fallback

```sh
python scripts/validate_data.py && pytest && az webapp up --name <app-name>
```

## Configuration

Environment variables are documented in `.env.example`. On Azure, set them as application settings. No secrets belong in the repo (NFR-05), and the MVP needs none.

| Variable | Default | Purpose |
|---|---|---|
| `CLASSIFY_DATA_PATH` | `data/tcu_classes_spring27.json` | Term data |
| `CLASSIFY_META_PATH` | `data/term_meta.json` | Timestamp and source |
| `CLASSIFY_SHOWCASE_PATH` | `data/instructors_showcase.json` | Showcase instructors |
| `FLASK_DEBUG` | `0` | Local debugging. Flask removed `FLASK_ENV` in version 2.3 |

## Check after deploying

1. `/api/health` returns 200.
2. `/api/meta` shows the expected term and `scraped_at`.
3. The home page shows the term, the timestamp, and the footer disclaimer.

## Domain

Use the Azure default for now. `classify.tcu.edu` needs TCU IT approval, and `tcu.com` isn't ours (D-14, OQ-06). A custom domain requires leaving the Free tier.
