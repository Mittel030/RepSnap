#!/bin/bash
set -e

echo "=== RepSnap deployment setup ==="

# Update system
apt-get update -y && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Start Docker
systemctl enable docker
systemctl start docker

# Create uploads directory with correct permissions
mkdir -p /opt/repsnap/uploads
chmod 777 /opt/repsnap/uploads

# Clone the repo
if [ -d "/opt/repsnap/.git" ]; then
  echo "Repo already exists, pulling latest..."
  cd /opt/repsnap && git pull
else
  git clone https://github.com/Mittel030/RepSnap.git /opt/repsnap
fi

cd /opt/repsnap

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "=== Done! ==="
echo "RepSnap is starting. Give it 30 seconds then open https://repsnap.nl"
echo ""
echo "Useful commands:"
echo "  View logs:    docker compose -f /opt/repsnap/docker-compose.prod.yml logs -f"
echo "  Restart:      docker compose -f /opt/repsnap/docker-compose.prod.yml restart"
echo "  Update app:   cd /opt/repsnap && git pull && docker compose -f docker-compose.prod.yml up -d --build"
