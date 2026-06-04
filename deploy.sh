#!/usr/bin/env bash
set -e

# ═══════════════════════════════════════════
# YODA Shop + Julius AI — One-Click Deploy
# ═══════════════════════════════════════════
# Run this on a fresh Ubuntu server:
#   curl -sL https://raw.githubusercontent.com/auryxn/yoda-shop/main/deploy.sh | bash
# Or:
#   wget -qO- https://raw.githubusercontent.com/auryxn/yoda-shop/main/deploy.sh | bash
# ═══════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GOLD='\033[0;33m'
NC='\033[0m'

echo -e "${GOLD}"
echo "╔══════════════════════════════════════╗"
echo "║     🦾 YODA SHOP DEPLOY v1.0         ║"
echo "║     Dark Fantasy Edition             ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# ─── 1. Node.js ───
echo -e "${YELLOW}[1/5] Installing Node.js 22...${NC}"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "  ✓ Node $(node -v)"

# ─── 2. Clone repo ───
echo -e "${YELLOW}[2/5] Cloning YODA Shop...${NC}"
if [ -d yoda-shop ]; then
  cd yoda-shop && git pull
else
  git clone https://github.com/auryxn/yoda-shop.git
  cd yoda-shop
fi

# ─── 3. Install dependencies ───
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
cd server && npm install && cd ..
cd client && npm install && cd ..

# ─── 4. .env ───
echo -e "${YELLOW}[4/5] Configuring environment...${NC}"
if [ ! -f server/.env ]; then
  cat > server/.env <<EOF
PORT=4000
NODE_ENV=production
STRIPE_SECRET_KEY=sk_test_placeholder
EOF
  echo "  ⚠️  Set your STRIPE_SECRET_KEY in server/.env"
fi

# ─── 5. Build & Start ───
echo -e "${YELLOW}[5/5] Building & starting...${NC}"
cd client && npx vite build && cd ..

# Kill old processes
kill $(lsof -t -i:4000) 2>/dev/null || true
kill $(lsof -t -i:5173) 2>/dev/null || true

# Start server (production — serves built frontend)
NODE_ENV=production node server/index.js &
SERVER_PID=$!

# Serve frontend with Vite preview
cd client && npx vite preview --host --port 5173 &
CLIENT_PID=$!

sleep 2

echo ""
echo -e "${GOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GOLD}║${NC}  🦾 YODA Shop is LIVE!             ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  Frontend: http://$(curl -s ifconfig.me):5173  ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  API:      http://localhost:4000       ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  Admin:    /admin (pass: admin)        ${GOLD}║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo "  📦 Project: /root/yoda-shop"
echo "  🔄 Update:  cd yoda-shop && git pull && bash deploy.sh"
echo ""

# ─── Save run script ───
cat > /root/start-yoda.sh <<'SCRIPT'
#!/usr/bin/env bash
cd /root/yoda-shop
kill $(lsof -t -i:4000) 2>/dev/null; kill $(lsof -t -i:5173) 2>/dev/null
NODE_ENV=production node server/index.js &
cd client && npx vite preview --host --port 5173 &
echo "🦾 YODA running"
SCRIPT
chmod +x /root/start-yoda.sh

wait $SERVER_PID $CLIENT_PID
