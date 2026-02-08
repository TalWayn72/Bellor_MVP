# תוכנית פריסה ל-Oracle Cloud - סביבת QA
## Oracle Cloud Always Free - QA Environment Deployment Plan

**תאריך:** 3 בפברואר 2026
**מטרה:** פריסת Bellor MVP לסביבת QA חינמית ב-Oracle Cloud
**עלות:** $0 לצמיתות

---

## 📋 סיכום מנהלים

תוכנית זו מתארת את כל השלבים לפריסת Bellor MVP על Oracle Cloud Always Free tier.
הפתרון כולל:
- VM עם 24GB RAM ו-4 CPU cores (ARM) - **חינם לצמיתות**
- פריסה אוטומטית מ-GitHub באמצעות CI/CD
- כל הרכיבים (PostgreSQL, Redis, API, Frontend) רצים כקונטיינרים

---

## 🎯 דרישות מוקדמות

### לפני שמתחילים:
- [ ] חשבון GitHub עם הפרויקט
- [ ] כתובת email תקינה
- [ ] כרטיס אשראי לאימות (לא יחויב)
- [ ] גישה לטרמינל/SSH

### משאבי Oracle Cloud Free Tier:
| משאב | כמות | הערות |
|------|------|-------|
| **ARM VM** | 4 CPUs + 24GB RAM | או 4 VMs קטנים יותר |
| **Block Storage** | 200GB | לכל החשבון |
| **Bandwidth** | 10TB/חודש | Outbound |
| **Load Balancer** | 1 | 10Mbps |

---

## 📅 תוכנית עבודה מפורטת

---

### שלב 1: רישום ל-Oracle Cloud (15 דקות)

#### 1.1 יצירת חשבון
```
1. גש ל: https://cloud.oracle.com/free
2. לחץ "Start for free"
3. מלא פרטים:
   - Country: Israel
   - Email: <your-email>
   - Account Type: Individual
4. אמת email
5. הזן פרטי כרטיס אשראי (לא יחויב!)
6. בחר Home Region: me-jeddah-1 (הקרוב לישראל)
```

#### 1.2 אימות חשבון
```
1. המתן להודעת אישור (עד 24 שעות, בדר"כ דקות)
2. התחבר ל-Oracle Cloud Console
3. ודא שאתה רואה "Always Free" badge
```

**✅ Checkpoint:** יש לך גישה ל-Oracle Cloud Console

---

### שלב 2: יצירת Virtual Cloud Network - VCN (10 דקות)

#### 2.1 יצירת רשת
```
1. Menu → Networking → Virtual Cloud Networks
2. "Start VCN Wizard" → "Create VCN with Internet Connectivity"
3. הגדרות:
   - VCN Name: bellor-vcn
   - Compartment: root (default)
   - VCN IPv4 CIDR: 10.0.0.0/16
4. לחץ "Next" → "Create"
```

#### 2.2 הגדרת Security List (Firewall)
```
1. לחץ על ה-VCN שיצרת
2. Security Lists → Default Security List
3. "Add Ingress Rules":

   Rule 1 - HTTP:
   - Source CIDR: 0.0.0.0/0
   - Destination Port: 80
   - Description: HTTP

   Rule 2 - HTTPS:
   - Source CIDR: 0.0.0.0/0
   - Destination Port: 443
   - Description: HTTPS

   Rule 3 - API:
   - Source CIDR: 0.0.0.0/0
   - Destination Port: 3000
   - Description: API Server

   Rule 4 - SSH (כבר קיים):
   - Source CIDR: 0.0.0.0/0
   - Destination Port: 22
```

**✅ Checkpoint:** VCN מוכן עם כל הפורטים פתוחים

---

### שלב 3: יצירת VM Instance (10 דקות)

#### 3.1 יצירת Compute Instance
```
1. Menu → Compute → Instances
2. "Create Instance"
3. הגדרות:

   Name: bellor-qa-server

   Placement:
   - Availability Domain: AD-1 (default)

   Image and Shape:
   - Image: Ubuntu 22.04 (Canonical)
   - Shape: VM.Standard.A1.Flex (ARM) ⚠️ חשוב!
   - OCPUs: 4
   - Memory: 24 GB

   Networking:
   - VCN: bellor-vcn
   - Subnet: Public Subnet
   - Public IPv4: Assign

   SSH Keys:
   - Generate a key pair (הורד את ה-private key!)
   - או: Paste public key (אם יש לך)

   Boot Volume:
   - Size: 100 GB (מתוך 200 Free)

4. לחץ "Create"
```

#### 3.2 שמירת פרטי התחברות
```bash
# שמור את:
# 1. Public IP: xxx.xxx.xxx.xxx
# 2. Private Key: ~/bellor-qa-key.pem
# 3. Username: ubuntu (default)

# הגדר הרשאות למפתח:
chmod 400 ~/bellor-qa-key.pem
```

#### 3.3 בדיקת התחברות
```bash
ssh -i ~/bellor-qa-key.pem ubuntu@<PUBLIC_IP>
```

**✅ Checkpoint:** מחובר ל-VM בהצלחה

---

### שלב 4: התקנת Docker והכנת השרת (15 דקות)

#### 4.1 התחבר ל-VM
```bash
ssh -i ~/bellor-qa-key.pem ubuntu@<PUBLIC_IP>
```

#### 4.2 עדכון המערכת
```bash
sudo apt update && sudo apt upgrade -y
```

#### 4.3 התקנת Docker
```bash
# התקנה אוטומטית
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# הוסף את המשתמש לקבוצת docker
sudo usermod -aG docker ubuntu

# יציאה וכניסה מחדש
exit
# התחבר מחדש
ssh -i ~/bellor-qa-key.pem ubuntu@<PUBLIC_IP>

# ודא שDocker עובד
docker --version
docker compose version
```

#### 4.4 התקנת כלים נוספים
```bash
sudo apt install -y git curl wget htop
```

#### 4.5 פתיחת Firewall (iptables)
```bash
# Oracle Linux משתמש ב-iptables בנוסף ל-Security List
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT

# שמירת הכללים
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

**✅ Checkpoint:** Docker מותקן ועובד

---

### שלב 5: הגדרת Git ו-SSH Keys (10 דקות)

#### 5.1 יצירת SSH Key לגישה ל-GitHub
```bash
# צור מפתח SSH
ssh-keygen -t ed25519 -C "bellor-qa-server"
# Enter → Enter → Enter (defaults)

# הצג את המפתח הציבורי
cat ~/.ssh/id_ed25519.pub
```

#### 5.2 הוספת המפתח ל-GitHub
```
1. העתק את הפלט של הפקודה למעלה
2. GitHub → Settings → SSH and GPG Keys → New SSH Key
3. Title: Bellor QA Server
4. Key: <הדבק את המפתח>
5. Add SSH Key
```

#### 5.3 בדיקת חיבור
```bash
ssh -T git@github.com
# צפוי: "Hi <username>! You've successfully authenticated..."
```

#### 5.4 הגדרת Git
```bash
git config --global user.name "Bellor QA Deploy"
git config --global user.email "deploy@bellor.app"
```

**✅ Checkpoint:** GitHub מוגדר ומחובר

---

### שלב 6: Clone הפרויקט והגדרת Environment (10 דקות)

#### 6.1 Clone הפרויקט
```bash
cd /opt
sudo mkdir -p bellor
sudo chown ubuntu:ubuntu bellor
cd bellor

git clone git@github.com:TalWayn72/Bellor_MVP.git .
```

#### 6.2 יצירת קובץ Environment
```bash
# צור secrets מאובטחים
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16)
REDIS_PASSWORD=$(openssl rand -base64 16)

# צור קובץ .env.production
cat > .env.production << EOF
# ===== Bellor QA Environment =====
NODE_ENV=production

# Database (internal container)
DATABASE_URL=postgresql://bellor:${POSTGRES_PASSWORD}@postgres:5432/bellor
POSTGRES_USER=bellor
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=bellor

# Redis (internal container)
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# URLs - עדכן לפי ה-IP או Domain שלך
FRONTEND_URL=http://<PUBLIC_IP>
VITE_API_URL=http://<PUBLIC_IP>:3000
VITE_WS_URL=ws://<PUBLIC_IP>:3000
VITE_CDN_URL=http://<PUBLIC_IP>:3000

# Ports
API_PORT=3000
WEB_PORT=80

# Logging
LOG_LEVEL=info
EOF

# עדכן את ה-IP האמיתי
nano .env.production
```

#### 6.3 אבטחת הקובץ
```bash
chmod 600 .env.production
```

**✅ Checkpoint:** הפרויקט מוכן להפעלה

---

### שלב 7: Build והפעלה ראשונית (15 דקות)

#### 7.1 Build הקונטיינרים
```bash
# Build (ייקח כ-10 דקות בפעם הראשונה)
docker compose -f docker-compose.all-in-one.yml --env-file .env.production build
```

#### 7.2 הפעלת השירותים
```bash
# הפעלה
docker compose -f docker-compose.all-in-one.yml --env-file .env.production up -d

# בדיקת סטטוס
docker compose -f docker-compose.all-in-one.yml ps
```

#### 7.3 הרצת Migrations
```bash
# המתן שהשירותים יעלו (30 שניות)
sleep 30

# הרץ migrations
docker compose -f docker-compose.all-in-one.yml exec api npx prisma migrate deploy

# הרץ seed (משתמשי דמו)
docker compose -f docker-compose.all-in-one.yml exec api npx prisma db seed
```

#### 7.4 בדיקת תקינות
```bash
# בדוק health endpoint
curl http://localhost:3000/health

# בדוק frontend
curl http://localhost:80/health

# בדוק לוגים
docker compose -f docker-compose.all-in-one.yml logs -f --tail=50
```

**✅ Checkpoint:** האפליקציה רצה!

---

### שלב 8: הגדרת Auto-Deploy מ-GitHub (20 דקות)

#### 8.1 יצירת Deploy Script
```bash
cat > /opt/bellor/scripts/auto-deploy.sh << 'EOF'
#!/bin/bash
# Bellor QA Auto-Deploy Script

set -e

cd /opt/bellor

echo "$(date) - Starting deployment..."

# Pull latest code
git fetch origin
git reset --hard origin/main

# Build and restart
docker compose -f docker-compose.all-in-one.yml --env-file .env.production build
docker compose -f docker-compose.all-in-one.yml --env-file .env.production up -d

# Run migrations
sleep 30
docker compose -f docker-compose.all-in-one.yml exec -T api npx prisma migrate deploy

# Cleanup
docker system prune -f

echo "$(date) - Deployment completed!"
EOF

chmod +x /opt/bellor/scripts/auto-deploy.sh
```

#### 8.2 אפשרות א׳: GitHub Webhook (מומלץ)

##### יצירת Webhook Listener
```bash
# התקן webhook listener
sudo apt install -y webhook

# צור הגדרה
sudo mkdir -p /etc/webhook
cat > /etc/webhook/hooks.json << 'EOF'
[
  {
    "id": "deploy-bellor",
    "execute-command": "/opt/bellor/scripts/auto-deploy.sh",
    "command-working-directory": "/opt/bellor",
    "response-message": "Deployment triggered",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "YOUR_WEBHOOK_SECRET",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
EOF
```

##### הפעלת Webhook Service
```bash
# צור systemd service
sudo cat > /etc/systemd/system/webhook.service << 'EOF'
[Unit]
Description=Webhook Server
After=network.target

[Service]
ExecStart=/usr/bin/webhook -hooks /etc/webhook/hooks.json -port 9000 -verbose
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable webhook
sudo systemctl start webhook
```

##### הגדרת GitHub Webhook
```
1. GitHub Repo → Settings → Webhooks → Add webhook
2. Payload URL: http://<PUBLIC_IP>:9000/hooks/deploy-bellor
3. Content type: application/json
4. Secret: YOUR_WEBHOOK_SECRET (אותו ערך כמו בהגדרה)
5. Events: Just the push event
6. Active: ✓
7. Add webhook
```

##### פתיחת פורט 9000
```bash
# ב-Oracle Security List:
# הוסף Ingress Rule:
# - Source CIDR: 0.0.0.0/0
# - Destination Port: 9000
# - Description: GitHub Webhook

# ב-iptables:
sudo iptables -I INPUT -p tcp --dport 9000 -j ACCEPT
sudo netfilter-persistent save
```

#### 8.3 אפשרות ב׳: GitHub Actions SSH Deploy

##### הוספת Secrets ל-GitHub
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret:

1. QA_HOST: <PUBLIC_IP>
2. QA_USER: ubuntu
3. QA_SSH_KEY: <תוכן של bellor-qa-key.pem>
```

##### יצירת Workflow חדש
צור קובץ `.github/workflows/deploy-qa.yml`:

```yaml
name: Deploy to QA (Oracle Cloud)

on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Oracle Cloud QA
    runs-on: ubuntu-latest
    environment: qa

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.QA_HOST }}
          username: ${{ secrets.QA_USER }}
          key: ${{ secrets.QA_SSH_KEY }}
          script: |
            cd /opt/bellor
            git fetch origin
            git reset --hard origin/${{ github.ref_name }}
            docker compose -f docker-compose.all-in-one.yml --env-file .env.production build
            docker compose -f docker-compose.all-in-one.yml --env-file .env.production up -d
            sleep 30
            docker compose -f docker-compose.all-in-one.yml exec -T api npx prisma migrate deploy
            docker system prune -f
            echo "Deployment completed!"

      - name: Verify deployment
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.QA_HOST }}
          username: ${{ secrets.QA_USER }}
          key: ${{ secrets.QA_SSH_KEY }}
          script: |
            curl -f http://localhost:3000/health || exit 1
            curl -f http://localhost:80/health || exit 1
            echo "Health checks passed!"
```

**✅ Checkpoint:** Auto-deploy מוגדר

---

### שלב 9: הגדרת Domain ו-SSL (אופציונלי, 15 דקות)

#### 9.1 הגדרת DNS
```
1. בספק ה-DNS שלך:
   - qa.bellor.app → A Record → <PUBLIC_IP>
   - או: bellor-qa.yourdomain.com → A Record → <PUBLIC_IP>
```

#### 9.2 התקנת Certbot
```bash
sudo apt install -y certbot
```

#### 9.3 קבלת SSL Certificate
```bash
# עצור את ה-web container זמנית
docker compose -f docker-compose.all-in-one.yml stop web

# קבל certificate
sudo certbot certonly --standalone -d qa.bellor.app

# הפעל מחדש
docker compose -f docker-compose.all-in-one.yml start web
```

#### 9.4 הגדרת Nginx עם SSL (אופציונלי)
```bash
# התקן nginx על ה-host
sudo apt install -y nginx

# צור הגדרה
sudo cat > /etc/nginx/sites-available/bellor << 'EOF'
server {
    listen 80;
    server_name qa.bellor.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name qa.bellor.app;

    ssl_certificate /etc/letsencrypt/live/qa.bellor.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/qa.bellor.app/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/bellor /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

### שלב 10: Monitoring ובדיקות (10 דקות)

#### 10.1 בדיקת המערכת
```bash
# סטטוס כל הקונטיינרים
docker compose -f docker-compose.all-in-one.yml ps

# צריכת משאבים
docker stats

# לוגים
docker compose -f docker-compose.all-in-one.yml logs -f

# Health checks
curl http://<PUBLIC_IP>:3000/health
curl http://<PUBLIC_IP>/health
```

#### 10.2 בדיקות פונקציונליות
```bash
# בדוק רישום משתמש
curl -X POST http://<PUBLIC_IP>:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'

# בדוק התחברות
curl -X POST http://<PUBLIC_IP>:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### 10.3 הגדרת התראות (אופציונלי)
```bash
# צור script לבדיקת health
cat > /opt/bellor/scripts/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -sf http://localhost:3000/health > /dev/null; then
    echo "$(date) - API is down! Restarting..." >> /var/log/bellor-health.log
    cd /opt/bellor
    docker compose -f docker-compose.all-in-one.yml restart api
fi
EOF

chmod +x /opt/bellor/scripts/health-check.sh

# הוסף ל-crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/bellor/scripts/health-check.sh") | crontab -
```

**✅ Checkpoint:** המערכת עובדת ומנוטרת

---

## 📊 סיכום שלבים

| שלב | תיאור | זמן משוער |
|-----|-------|-----------|
| 1 | רישום Oracle Cloud | 15 דקות |
| 2 | יצירת VCN | 10 דקות |
| 3 | יצירת VM | 10 דקות |
| 4 | התקנת Docker | 15 דקות |
| 5 | הגדרת Git/SSH | 10 דקות |
| 6 | Clone והגדרת Environment | 10 דקות |
| 7 | Build והפעלה | 15 דקות |
| 8 | Auto-Deploy מ-GitHub | 20 דקות |
| 9 | Domain + SSL (אופציונלי) | 15 דקות |
| 10 | Monitoring ובדיקות | 10 דקות |
| **סה"כ** | | **~2 שעות** |

---

## 🔧 פקודות שימושיות

### עדכון ידני
```bash
cd /opt/bellor
git pull origin main
docker compose -f docker-compose.all-in-one.yml --env-file .env.production up -d --build
```

### צפייה בלוגים
```bash
docker compose -f docker-compose.all-in-one.yml logs -f api
docker compose -f docker-compose.all-in-one.yml logs -f web
```

### גיבוי Database
```bash
docker compose -f docker-compose.all-in-one.yml exec postgres \
  pg_dump -U bellor bellor > backup_$(date +%Y%m%d).sql
```

### Restart שירותים
```bash
docker compose -f docker-compose.all-in-one.yml restart
```

### ניקוי Docker
```bash
docker system prune -af
```

---

## ⚠️ נקודות חשובות

1. **אל תשתף את קובץ .env.production** - מכיל secrets!
2. **שמור על ה-private key** - בלי זה אין גישה לשרת
3. **גבה את ה-Database** - לפחות פעם בשבוע
4. **עקוב אחרי משאבים** - Oracle עלול לסגור חשבונות לא פעילים
5. **בדוק health checks** - ודא שהמערכת עובדת

---

## 📚 מסמכים קשורים

- [CLOUD_AGNOSTIC_DEPLOYMENT.md](CLOUD_AGNOSTIC_DEPLOYMENT.md) - אסטרטגיית פריסה כללית
- [FREE_HOSTING_OPTIONS.md](FREE_HOSTING_OPTIONS.md) - אפשרויות אירוח חינמיות
- [QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md) - מדריך פריסה מהיר
- [DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md](DEPLOYMENT_INFRASTRUCTURE_COMPLETE.md) - סטטוס תשתית

---

## 🎉 סיום

לאחר השלמת כל השלבים, תהיה לך סביבת QA עובדת עם:
- ✅ פריסה אוטומטית מ-GitHub
- ✅ 24GB RAM + 4 CPU cores
- ✅ 100GB storage
- ✅ **$0 עלות לצמיתות**

---

**עדכון אחרון:** 3 בפברואר 2026
**מחבר:** Claude Code
**גרסה:** 1.0.0
