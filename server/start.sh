#!/bin/bash
cd /root/.openclaw/workspace/yoda-shop/server
node index.js &
sleep 2
curl -s localhost:4000/api/health
