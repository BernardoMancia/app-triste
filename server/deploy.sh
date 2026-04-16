#!/bin/bash
set -e

echo "=== App Triste - Deploy via Git ==="
echo ""

APP_DIR="/opt/app-triste"
DB_NAME="app_triste"
DB_USER="apptriste"
DB_PASS="$(openssl rand -base64 24)"
REPO_URL="https://github.com/BernardoMancia/app-triste.git"

echo "[1/7] Instalando dependências do sistema..."
apt-get update -qq
apt-get install -y -qq git python3 python3-pip python3-venv postgresql postgresql-contrib > /dev/null 2>&1

echo "[2/7] Clonando repositório..."
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git pull origin main
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

echo "[3/7] Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
    sudo -u postgres createdb -O $DB_USER $DB_NAME

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "[4/7] Configurando ambiente Python..."
python3 -m venv $APP_DIR/server/venv
source $APP_DIR/server/venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r $APP_DIR/server/requirements.txt

echo "[5/7] Criando .env..."
if [ ! -f "$APP_DIR/server/.env" ]; then
    cat > $APP_DIR/server/.env << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
HOST=0.0.0.0
PORT=2345
EOF
    echo "  .env criado com senha: $DB_PASS"
else
    echo "  .env já existe, mantendo..."
fi

echo "[6/7] Abrindo porta 2345..."
ufw allow 2345/tcp 2>/dev/null || true

echo "[7/7] Criando serviço systemd..."
cat > /etc/systemd/system/app-triste.service << EOF
[Unit]
Description=App Triste API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/server
Environment=PATH=$APP_DIR/server/venv/bin:/usr/bin
ExecStart=$APP_DIR/server/venv/bin/uvicorn main:app --host 0.0.0.0 --port 2345
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable app-triste
systemctl restart app-triste

sleep 2

echo ""
echo "========================================="
echo "  ✅ Deploy concluído!"
echo "========================================="
echo ""
echo "  API: http://82.112.245.99:2345"
echo "  Health: http://82.112.245.99:2345/api/health"
echo ""
echo "  Comandos úteis:"
echo "    systemctl status app-triste"
echo "    journalctl -u app-triste -f"
echo ""
echo "  Para atualizar:"
echo "    cd /opt/app-triste && git pull origin main"
echo "    systemctl restart app-triste"
echo "========================================="
