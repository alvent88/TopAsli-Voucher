# Setup AWS Credentials untuk Region ap-southeast-1 (Singapore)

## Step 1: Buat AWS Account

1. Kunjungi https://aws.amazon.com
2. Klik **Create an AWS Account**
3. Isi email, password, dan informasi billing
4. Verifikasi kartu kredit/debit (akan di-charge $1 untuk verifikasi)
5. Pilih Support Plan: **Basic (Free)**

## Step 2: Buat IAM User dengan Programmatic Access

### Via AWS Console:

1. **Login ke AWS Console**: https://console.aws.amazon.com
2. **Buka IAM Service**:
   - Search bar → ketik "IAM" → klik **IAM**
3. **Create User**:
   - Sidebar kiri → klik **Users**
   - Klik **Create user**
   - Username: `encore-deploy` (atau nama lain)
   - Klik **Next**

4. **Set Permissions**:
   - Pilih **Attach policies directly**
   - Centang policies berikut:
     - ✅ `AdministratorAccess` (untuk full access)
     - *Atau lebih secure: custom policy minimal permissions (lihat di bawah)*
   - Klik **Next**

5. **Review & Create**:
   - Review settings
   - Klik **Create user**

6. **Generate Access Keys**:
   - Klik user yang baru dibuat (`encore-deploy`)
   - Tab **Security credentials**
   - Scroll ke **Access keys**
   - Klik **Create access key**
   - Pilih use case: **Command Line Interface (CLI)**
   - Centang "I understand..."
   - Klik **Next**
   - Description: `Encore Deployment`
   - Klik **Create access key**

7. **SIMPAN CREDENTIALS** (tidak akan ditampilkan lagi!):
   ```
   Access Key ID: AKIAXXXXXXXXXXXXXXXX
   Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Step 3: Install AWS CLI

### macOS:
```bash
brew install awscli
```

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install awscli -y
```

### Windows:
Download installer: https://aws.amazon.com/cli/

Atau via PowerShell:
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

### Verify Installation:
```bash
aws --version
# Output: aws-cli/2.x.x Python/3.x.x ...
```

## Step 4: Configure AWS CLI dengan Region ap-southeast-1

```bash
aws configure
```

Isi dengan credentials yang disimpan:

```
AWS Access Key ID [None]: AKIAXXXXXXXXXXXXXXXX
AWS Secret Access Key [None]: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Default region name [None]: ap-southeast-1
Default output format [None]: json
```

### Verify Configuration:

```bash
# Check configured region
aws configure get region
# Output: ap-southeast-1

# Test connection
aws sts get-caller-identity
# Output: 
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/encore-deploy"
# }

# List S3 buckets di Singapore region (test permissions)
aws s3 ls --region ap-southeast-1
```

## Step 5: Set Environment Variables (Optional)

Tambahkan ke `~/.bashrc` atau `~/.zshrc`:

```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
export AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export AWS_DEFAULT_REGION=ap-southeast-1
export AWS_REGION=ap-southeast-1
```

Reload:
```bash
source ~/.bashrc  # atau ~/.zshrc
```

## Step 6: Setup Multiple Profiles (Optional)

Jika punya multiple AWS accounts:

```bash
# Configure profile untuk production
aws configure --profile production
# Isi dengan credentials production

# Configure profile untuk staging
aws configure --profile staging
# Isi dengan credentials staging
```

Edit `~/.aws/config`:
```ini
[default]
region = ap-southeast-1
output = json

[profile production]
region = ap-southeast-1
output = json

[profile staging]
region = ap-southeast-1
output = json
```

Edit `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIAXXXXXXXXXXXXXXXX
aws_secret_access_key = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

[production]
aws_access_key_id = AKIAYYYYYYYYYYYYYYYY
aws_secret_access_key = yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

[staging]
aws_access_key_id = AKIAZZZZZZZZZZZZZZZZ
aws_secret_access_key = zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
```

Use profile:
```bash
aws s3 ls --profile production
# atau
export AWS_PROFILE=production
```

## Security Best Practices

### 1. Gunakan IAM User, Bukan Root Account
❌ Jangan pakai root account credentials
✅ Selalu buat IAM user untuk programmatic access

### 2. Enable MFA (Multi-Factor Authentication)
```bash
# Install virtual MFA app (Google Authenticator, Authy, dll)
# Di AWS Console → IAM → Users → Security credentials → Assign MFA device
```

### 3. Rotate Access Keys Secara Berkala
```bash
# Setiap 90 hari, generate new access keys
aws iam create-access-key --user-name encore-deploy

# Delete old keys
aws iam delete-access-key --access-key-id AKIAOLDXXXXXXXXX --user-name encore-deploy
```

### 4. Gunakan Minimal Permissions (Least Privilege)

Daripada `AdministratorAccess`, gunakan custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "rds:*",
        "s3:*",
        "cloudwatch:*",
        "logs:*",
        "iam:PassRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

Save sebagai `encore-deploy-policy.json`, lalu attach:

```bash
aws iam create-policy \
  --policy-name EncoreDeployPolicy \
  --policy-document file://encore-deploy-policy.json

aws iam attach-user-policy \
  --user-name encore-deploy \
  --policy-arn arn:aws:iam::123456789012:policy/EncoreDeployPolicy
```

## Troubleshooting

### Issue: "Unable to locate credentials"
```bash
# Check credentials file
cat ~/.aws/credentials

# Re-configure
aws configure
```

### Issue: "Access Denied"
```bash
# Check current user
aws sts get-caller-identity

# Check attached policies
aws iam list-attached-user-policies --user-name encore-deploy
```

### Issue: Wrong region
```bash
# Force set region
export AWS_DEFAULT_REGION=ap-southeast-1
export AWS_REGION=ap-southeast-1

# Or re-configure
aws configure set region ap-southeast-1
```

### Issue: Credentials file corrupted
```bash
# Backup old credentials
cp ~/.aws/credentials ~/.aws/credentials.backup

# Re-create
rm ~/.aws/credentials
aws configure
```

## Verify Everything is Working

```bash
# 1. Check identity
aws sts get-caller-identity

# 2. Check region
aws configure get region

# 3. List available regions
aws ec2 describe-regions --output table

# 4. Test RDS availability in ap-southeast-1
aws rds describe-db-instances --region ap-southeast-1

# 5. Test Lambda availability
aws lambda list-functions --region ap-southeast-1

# 6. Test S3 access
aws s3 ls --region ap-southeast-1
```

Jika semua command di atas berhasil, AWS credentials sudah ready untuk deployment Encore.ts ke `ap-southeast-1`!

## Next Steps

Setelah AWS credentials ready:

```bash
# 1. Link Encore app
encore app link

# 2. Create production environment
encore env create production --cloud=aws --region=ap-southeast-1

# 3. Deploy
encore deploy production
```

## Useful Commands

```bash
# List all configured profiles
aws configure list-profiles

# Show current configuration
aws configure list

# Get account ID
aws sts get-caller-identity --query Account --output text

# List all IAM users
aws iam list-users

# Get specific user details
aws iam get-user --user-name encore-deploy
```
