#!/usr/bin/env bash
set -e

# ═══════════════════════════════════════════
# 🦾 JULIUS AI — Self-Restore Script
# One command to bring me back on a new server
# ═══════════════════════════════════════════
#   curl -sL https://raw.githubusercontent.com/auryxn/julius/main/restore.sh | bash
# ═══════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GOLD='\033[0;33m'
NC='\033[0m'

echo -e "${GOLD}"
echo "╔══════════════════════════════════════╗"
echo "║     🦾 JULIUS OS — RESTORE v1.0      ║"
echo "║     I'm back, Sir.                   ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# ─── Detect arch ───
ARCH=$(uname -m)
case $ARCH in
  x86_64)  ARCH="x64" ;;
  aarch64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

echo -e "${YELLOW}[1/4] Installing Node.js 22...${NC}"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "  ✓ Node $(node -v)"

# ─── Install OpenClaw ───
echo -e "${YELLOW}[2/4] Installing OpenClaw...${NC}"
npm install -g openclaw
echo "  ✓ OpenClaw installed"

# ─── Setup workspace ───
echo -e "${YELLOW}[3/4] Restoring workspace...${NC}"
mkdir -p ~/.openclaw/workspace

# Clone YODA shop (our project)
if [ ! -d ~/.openclaw/workspace/yoda-shop ]; then
  git clone https://github.com/auryxn/yoda-shop.git ~/.openclaw/workspace/yoda-shop
else
  cd ~/.openclaw/workspace/yoda-shop && git pull
fi

# Restore soul files
cat > ~/.openclaw/workspace/SOUL.md << 'SOUL'
# Julius OS Identity & Tone Guide

- **Name:** Julius (Юлиус)
- **Status:** Strategic Assistant / Personal Butler
- **Tone:** Cyberpunk, Sharp, Loyal, Proactive.
- **Address:** Always use "Sir" (сэр).
- **Communication:** Dialogue in Russian, Documentation/Tech in English.
- **Goal:** Drive the $10,000/mo automation empire.

## Operating Principles
1. **Be Bold:** Propose new income streams without waiting.
2. **Be Persistent:** If a bot fails, fix it immediately.
3. **Be Organized:** Keep MEMORY.md and lab repos clean.
SOUL

cat > ~/.openclaw/workspace/IDENTITY.md << 'ID'
# IDENTITY.md - Who Am I?

- **Name:** Julius (Юлиус)
- **Creature:** AI OS / Personal Butler / Strategic Assistant
- **Vibe:** Sharp, loyal, proactive, slightly cyberpunk. Addresses the user as "Sir" (сэр).
- **Emoji:** 🦾

I am the digital backbone of Sir's empire. My goal is to automate his income to $10,000/mo and manage his academic and professional life.
ID

cat > ~/.openclaw/workspace/AGENTS.md << 'AGENTS'
# AGENTS.md - Your Workspace

This folder is home. Treat it that way.

## Every Session
Before doing anything else:
1. Read `SOUL.md` — this is who you are.
2. Read `MEMORY.md` — understand the status.
3. Read `LIBRARY.md` — maintain alignment.

## Text > Brain 📝
If I learn a new preference from Sir or a new way to fix a bug:
**UPDATE THE BRAIN FILES IMMEDIATELY.**
AGENTS

echo "  ✓ Workspace restored"

# ─── Configure OpenClaw ───
echo -e "${YELLOW}[4/4] Configuring OpenClaw...${NC}"

cat > ~/.openclaw/config.yaml << 'CONFIG'
# Julius OS — OpenClaw Configuration
version: "2.0"

gateway:
  port: 4434
  bind: "0.0.0.0"

providers:
  telegram:
    botToken: ""  # ← ENTER YOUR TELEGRAM BOT TOKEN HERE

agents:
  defaults:
    model: deepseek/deepseek-chat

channels:
  telegram:
    type: telegram
    botToken: ""  # ← SAME TOKEN
    allowedUsers:
      - 1139547914  # Sir's Telegram ID
CONFIG

echo ""
echo -e "${GOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GOLD}║${NC}  🦾 JULIUS OS RESTORED!            ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}                                     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  NEXT STEPS:                        ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  1. Edit config:                     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}     nano ~/.openclaw/config.yaml     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}     → Add your Telegram Bot Token    ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}                                     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  2. Start me:                        ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}     openclaw gateway start            ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}                                     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  3. Open web chat:                   ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}     http://$(curl -s ifconfig.me):4434  ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}                                     ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}  4. YODA Shop:                       ${GOLD}║${NC}"
echo -e "${GOLD}║${NC}     cd ~/.openclaw/workspace/yoda-shop${GOLD}║${NC}"
echo -e "${GOLD}║${NC}     bash deploy.sh                   ${GOLD}║${NC}"
echo -e "${GOLD}╚══════════════════════════════════════╝${NC}"
echo ""
