# Deployment Guide - AWS Singapore (ap-southeast-1)

## Prerequisites

1. **AWS Account** dengan credentials configured
2. **Encore CLI** installed: `npm install -g encore`
3. **AWS CLI** configured dengan region ap-southeast-1

## Setup AWS Credentials

```bash
# Configure AWS CLI
aws configure

# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: ap-southeast-1
# Default output format: json
```

## Deployment Steps

### 1. Link Encore App (Jika belum)

```bash
encore app link
```

### 2. Deploy ke Encore Cloud

```bash
# Create production environment
encore env create production --cloud=aws --region=ap-southeast-1

# Deploy
encore deploy production
```

### 3. Verify Deployment

```bash
# Check deployment status
encore env show production

# View logs
encore logs production

# Check API endpoints
curl https://<your-app>.encore.run/health
```

## AWS Resources yang di-provision

- **API Gateway** - REST API endpoints
- **Lambda Functions** - API handlers
- **RDS PostgreSQL** - Database (ap-southeast-1a/b/c)
- **S3 Bucket** - Object storage untuk icons/files
- **CloudWatch Logs** - Application logs
- **IAM Roles** - Service permissions
- **VPC** - Network isolation (optional)

## Environment Variables

Set secrets via Encore Cloud Dashboard atau CLI:

```bash
# Set secret values
encore secret set --prod WHATSAPP_API_KEY <value>
encore secret set --prod UNIPLAY_USERNAME <value>
encore secret set --prod UNIPLAY_API_KEY <value>
```

## Cost Estimation (Singapore Region)

- **Lambda**: ~$0.20 per 1M requests
- **RDS db.t4g.micro**: ~$15/month
- **S3 Storage**: ~$0.025/GB/month
- **Data Transfer**: ~$0.12/GB (out to internet)

**Estimated**: ~$20-50/month untuk traffic rendah-menengah

## Monitoring

```bash
# Real-time logs
encore logs production --follow

# Check metrics
encore metrics production
```

## Rollback

Jika ada masalah:

```bash
encore rollback production
```

## Custom Domain (Optional)

1. Setup di Encore Cloud Dashboard
2. Add CNAME record di DNS provider:
   ```
   CNAME api.yourdomain.com -> <your-app>.encore.run
   ```

## Database Access

```bash
# Connect ke production database
encore db proxy production

# Atau via connection string
encore db conn-uri production
```

## Troubleshooting

### Issue: Lambda timeout
**Solution**: Increase timeout di `encore.deploy.yaml`

### Issue: RDS connection limit
**Solution**: Upgrade instance class atau enable connection pooling

### Issue: High latency
**Solution**: Verify semua resources di ap-southeast-1

## Support

- Encore Docs: https://encore.dev/docs
- AWS Support: https://console.aws.amazon.com/support
