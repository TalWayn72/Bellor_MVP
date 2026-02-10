# מדריך Deployment מהיר - Bellor MVP
## Quick Deployment Guide (Hebrew)

**תאריך:** 3 בפברואר 2026
**זמן התקנה:** 15-60 דקות (תלוי באפשרות)

---

## 🚀 3 דרכים לפריסה

| אפשרות | זמן | עלות/חודש | מתאים ל | קושי |
|--------|-----|-----------|---------|------|
| **A. Docker Compose** | 15 דקות | $16-50 | MVP, Staging | ⭐ קל |
| **B. Kubernetes** | 30 דקות | $72-150 | Production | ⭐⭐ בינוני |

---

## אפשרות A: Docker Compose (מומלץ להתחלה) ⭐

### מה צריך:
- ✅ VM עם Ubuntu 22.04
- ✅ 4GB RAM, 2 CPUs (מינימום)
- ✅ Domain name + DNS
- ✅ 15 דקות

### צעד 1: הכנת השרת (5 דקות)

```bash
# 1. התחבר לשרת
ssh root@your-server-ip

# 2. התקן Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. וודא שDocker רץ
docker --version
docker compose version
```

### צעד 2: העלאת הקוד (2 דקות)

```bash
# 1. Clone הפרויקט
cd /opt
git clone https://github.com/your-org/Bellor_MVP.git
cd Bellor_MVP

# או העתק ידנית אם אין Git:
# rsync -avz --progress ./Bellor_MVP/ root@your-server:/opt/Bellor_MVP/
```

### צעד 3: הגדרת סביבה (3 דקות)

```bash
# 1. צור קובץ .env.production
cat > .env.production << 'EOF'
# Database
DATABASE_URL=postgresql://bellor:CHANGE_ME@postgres:5432/bellor
POSTGRES_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# Redis
REDIS_URL=redis://:CHANGE_ME@redis:6379
REDIS_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_ME_32_CHARS_MINIMUM_SECRET
JWT_REFRESH_SECRET=CHANGE_ME_32_CHARS_MINIMUM_REFRESH

# URLs
FRONTEND_URL=https://bellor.example.com
VITE_API_URL=https://api.bellor.example.com
VITE_WS_URL=wss://api.bellor.example.com
VITE_CDN_URL=https://cdn.bellor.example.com

# Storage (Cloudflare R2 - יש להגדיר)
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET=bellor-media
CDN_URL=https://cdn.bellor.example.com
EOF

# 2. שנה את כל CHANGE_ME לערכים אמיתיים!
nano .env.production
```

### צעד 4: Build והפעלה (5 דקות)

```bash
# 1. Build images (פעם ראשונה)
docker compose -f docker-compose.prod.yml build

# 2. הפעל
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 3. בדוק שהכל רץ
docker compose -f docker-compose.prod.yml ps

# 4. הרץ migrations
docker compose -f docker-compose.prod.yml exec api pnpm prisma migrate deploy
docker compose -f docker-compose.prod.yml exec api pnpm prisma:seed
```

### צעד 5: SSL + Domain (בונוס)

```bash
# התקן nginx + certbot
apt install nginx certbot python3-certbot-nginx -y

# הגדר nginx reverse proxy
cat > /etc/nginx/sites-available/bellor << 'EOF'
server {
    server_name bellor.example.com;
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    server_name api.bellor.example.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# הפעל
ln -s /etc/nginx/sites-available/bellor /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# קבל SSL
certbot --nginx -d bellor.example.com -d api.bellor.example.com
```

### ✅ סיימנו!
גש ל-https://bellor.example.com

---

## אפשרות B: Kubernetes על DigitalOcean ⭐⭐

### מה צריך:
- ✅ חשבון DigitalOcean
- ✅ kubectl מותקן
- ✅ doctl מותקן (CLI של DO)
- ✅ 30 דקות

### צעד 1: צור Kubernetes Cluster (5 דקות)

```bash
# 1. התקן doctl
brew install doctl  # macOS
# או
snap install doctl  # Linux

# 2. התחבר
doctl auth init

# 3. צור cluster
doctl kubernetes cluster create bellor-cluster \
  --region nyc1 \
  --version latest \
  --size s-2vcpu-4gb \
  --count 3 \
  --auto-upgrade=true

# 4. הגדר kubectl
doctl kubernetes cluster kubeconfig save bellor-cluster
```

### צעד 2: הגדר Secrets (5 דקות)

```bash
# 1. צור secrets
kubectl create namespace bellor

kubectl create secret generic bellor-secrets \
  --from-literal=database-url="postgresql://USER:PASS@HOST/bellor" \
  --from-literal=redis-url="redis://:PASS@HOST:6379" \
  --from-literal=jwt-secret="YOUR_32_CHAR_SECRET" \
  --from-literal=jwt-refresh-secret="YOUR_32_CHAR_REFRESH" \
  --namespace=bellor

# 2. צור ConfigMap
kubectl create configmap bellor-config \
  --from-literal=frontend-url="https://bellor.example.com" \
  --from-literal=api-url="https://api.bellor.example.com" \
  --namespace=bellor
```

### צעד 3: Deploy (5 דקות)

```bash
# 1. Clone הפרויקט
git clone https://github.com/your-org/Bellor_MVP.git
cd Bellor_MVP

# 2. Build ו-Push images
docker build -f infrastructure/docker/Dockerfile.api -t your-registry/bellor-api:latest .
docker build -f infrastructure/docker/Dockerfile.web -t your-registry/bellor-web:latest .
docker push your-registry/bellor-api:latest
docker push your-registry/bellor-web:latest

# 3. Deploy ל-Kubernetes
kubectl apply -f infrastructure/kubernetes/

# 4. חכה לrollout
kubectl rollout status deployment/bellor-api -n bellor
kubectl rollout status deployment/bellor-web -n bellor
```

### צעד 4: הגדר Ingress + SSL (10 דקות)

```bash
# 1. התקן nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/do/deploy.yaml

# 2. התקן cert-manager (SSL אוטומטי)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 3. צור ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# 4. קבל את External IP
kubectl get svc -n ingress-nginx
```

### צעד 5: הפנה DNS (5 דקות)

```
1. לך לספק ה-DNS שלך
2. הוסף A Records:
   - bellor.example.com → External-IP
   - api.bellor.example.com → External-IP
3. חכה 5-10 דקות לפרופגציה
```

### ✅ סיימנו!
המערכת תיצור SSL אוטומטית תוך 5 דקות

---

## 📊 בדיקת תקינות

### Docker Compose:
```bash
# בדוק containers
docker compose -f docker-compose.prod.yml ps

# לוגים
docker compose -f docker-compose.prod.yml logs -f api

# health checks
curl http://localhost:3000/health
curl http://localhost/health
```

### Kubernetes:
```bash
# בדוק pods
kubectl get pods -n bellor

# לוגים
kubectl logs -f deployment/bellor-api -n bellor

# health
kubectl exec -it deployment/bellor-api -n bellor -- curl localhost:3000/health
```

---

## 🔧 פקודות שימושיות

### עדכון גרסה:
```bash
# Docker Compose
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Kubernetes
kubectl set image deployment/bellor-api api=your-registry/bellor-api:v1.2.0 -n bellor
kubectl rollout status deployment/bellor-api -n bellor
```

### גיבוי Database:
```bash
# Docker
docker compose exec postgres pg_dump -U bellor bellor > backup.sql

# Kubernetes
kubectl exec -it statefulset/postgres -n bellor -- pg_dump -U bellor bellor > backup.sql
```

### Rollback:
```bash
# Kubernetes
kubectl rollout undo deployment/bellor-api -n bellor
```

---

## 🆘 פתרון בעיות נפוצות

### בעיה: Containers לא עולים
```bash
# בדוק לוגים
docker compose logs api

# בדוק env variables
docker compose config
```

### בעיה: Database connection failed
```bash
# בדוק שPostgreSQL רץ
docker compose ps postgres
kubectl get pods -n bellor | grep postgres

# בדוק connection
docker compose exec api node -e "require('./dist/lib/prisma').prisma.\$connect().then(() => console.log('OK'))"
```

### בעיה: SSL לא עובד
```bash
# בדוק cert-manager
kubectl get certificates -n bellor
kubectl describe certificate bellor-tls -n bellor

# הרץ מחדש
kubectl delete certificate bellor-tls -n bellor
```

---

## 💰 עלויות משוערות

### Docker Compose (Hetzner):
```
VM (4GB, 2 CPUs):  €7-15/month
Domain:            $5/month
Total:             ~$15-20/month
```

### Kubernetes (VPS/Cloud):
```
K8s Nodes (3):     $72/month
Load Balancer:     $12/month
PostgreSQL (container): $0 (included)
Domain:            $5/month
Total:             ~$89/month
```

---

**זמן סה"כ:**
- Docker Compose: 15 דקות
- Kubernetes: 30-45 דקות

**קושי:**
- Docker Compose: ⭐ קל מאוד
- Kubernetes: ⭐⭐ בינוני

**מה שהכי מהיר:** Docker Compose על Hetzner - $16/חודש, 15 דקות setup!
