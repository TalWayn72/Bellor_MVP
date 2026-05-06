# Docker Desktop Setup for Windows

**Date:** February 3, 2026
**Purpose:** Install Docker Desktop to run Bellor MVP databases and services

---

## 📋 Prerequisites

- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- OR Windows 11 64-bit
- Hardware virtualization enabled in BIOS
- At least 4GB RAM (8GB recommended)

---

## 🚀 Installation Steps

### Option 1: Download and Install (Recommended)

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Or direct link: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

2. **Run the Installer:**
   ```powershell
   # Run as Administrator
   .\Docker Desktop Installer.exe
   ```

3. **Configuration during installation:**
   - ✅ Enable WSL 2 (Windows Subsystem for Linux) - **Recommended**
   - ✅ Add shortcut to desktop

4. **Complete Installation:**
   - Restart your computer when prompted
   - After restart, Docker Desktop will start automatically

5. **Verify Installation:**
   ```powershell
   docker --version
   docker compose version
   ```

### Option 2: Using Winget (Windows Package Manager)

```powershell
# Run as Administrator
winget install Docker.DockerDesktop
```

### Option 3: Using Chocolatey

```powershell
# Run as Administrator
choco install docker-desktop
```

---

## ⚙️ Post-Installation Configuration

### 1. Start Docker Desktop
- Open Docker Desktop from Start Menu
- Wait for "Docker Desktop is running" message

### 2. Configure Resources (Optional but Recommended)

Open Docker Desktop Settings:
- **Resources → Advanced:**
  - CPUs: 4 (or more if available)
  - Memory: 4GB (8GB recommended for Bellor)
  - Swap: 1GB
  - Disk image size: 64GB

### 3. Enable WSL 2 Backend (Recommended)

- **Settings → General:**
  - ✅ Use the WSL 2 based engine
- **Settings → Resources → WSL Integration:**
  - ✅ Enable integration with my default WSL distro

---

## 🧪 Test Docker Installation

```powershell
# Test Docker
docker run hello-world

# Test Docker Compose
docker compose version
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## 🐳 Start Bellor MVP Databases

Once Docker is installed and running:

```bash
# Navigate to project
cd C:\Users\talwa\.claude\projects\Bellor_MVP

# Start PostgreSQL and Redis
docker compose up -d

# Check containers are running
docker compose ps

# View logs
docker compose logs -f
```

Expected containers:
- `bellor-postgres` - PostgreSQL database (port 5432)
- `bellor-redis` - Redis cache (port 6379)

---

## 🔧 Troubleshooting

### Issue: "WSL 2 installation is incomplete"

**Solution:**
1. Install WSL 2:
   ```powershell
   wsl --install
   ```
2. Restart computer
3. Start Docker Desktop again

### Issue: "Docker Desktop requires a newer WSL kernel version"

**Solution:**
```powershell
wsl --update
```

### Issue: "Hardware assisted virtualization and data execution protection must be enabled in the BIOS"

**Solution:**
1. Restart computer
2. Enter BIOS (usually F2, F10, DEL, or ESC during boot)
3. Enable "Intel VT-x" or "AMD-V" (virtualization)
4. Enable "Intel VT-d" or "AMD IOMMU" (if available)
5. Save and exit BIOS

### Issue: Docker Desktop won't start

**Solution 1 - Reset to factory defaults:**
1. Open Docker Desktop
2. Settings → Troubleshoot → Reset to factory defaults

**Solution 2 - Restart Docker service:**
```powershell
# Run as Administrator
net stop com.docker.service
net start com.docker.service
```

### Issue: "Access denied" when running commands

**Solution:**
- Run PowerShell or Command Prompt as Administrator
- Add your user to "docker-users" group:
  ```powershell
  net localgroup docker-users "YOUR_USERNAME" /add
  ```
- Logout and login again

---

## 📚 Alternative: Using Docker without Docker Desktop

If you can't use Docker Desktop (licensing, resources, etc.), you can use:

### Option 1: Rancher Desktop
- Free and open source
- Download: https://rancherdesktop.io/
- Works on Windows, macOS, Linux

### Option 2: Podman Desktop
- Free and open source
- Download: https://podman-desktop.io/
- Drop-in replacement for Docker

### Option 3: WSL 2 + Docker Engine (Advanced)
Install Docker Engine directly in WSL 2 without Docker Desktop:
```bash
# Inside WSL 2 Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

---

## ✅ Verification Checklist

After installation, verify:

- [ ] Docker Desktop is running
- [ ] `docker --version` shows version
- [ ] `docker compose version` shows version
- [ ] `docker run hello-world` completes successfully
- [ ] Docker icon in system tray shows "Docker Desktop is running"

---

## 📖 Next Steps

Once Docker is installed and running:

1. **Start Bellor databases:**
   ```bash
   cd C:\Users\talwa\.claude\projects\Bellor_MVP
   docker compose up -d
   ```

2. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

3. **Seed demo data:**
   ```bash
   npm run prisma:seed
   ```

4. **Start Backend API:**
   ```bash
   npm run dev:api
   ```

5. **Start Frontend:**
   ```bash
   npm run dev
   ```

---

## 🔗 Useful Resources

- Docker Desktop Documentation: https://docs.docker.com/desktop/
- WSL 2 Documentation: https://learn.microsoft.com/en-us/windows/wsl/
- Docker Compose Documentation: https://docs.docker.com/compose/
- Bellor MVP Docker Compose: [../docker-compose.yml](../docker-compose.yml)

---

**Need Help?**
- Docker Desktop Support: https://docs.docker.com/desktop/troubleshoot/
- Bellor MVP Issues: Contact the development team

**Last Updated:** February 3, 2026
