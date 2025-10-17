#!/bin/bash

# Script de instalação para a aplicação Cuxinho no Rocky Linux 9

# --- Configurações --- 
APP_DIR="/opt/cuxinho"
PYTHON_VERSION="python3.11"

# --- Funções Auxiliares ---
log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo "[ERROR] $1"
    exit 1
}

# --- 1. Atualizar o sistema ---
log_info "Atualizando pacotes do sistema..."
sudo apt update -y && sudo apt upgrade -y || log_error "Falha ao atualizar o sistema."

# --- 2. Instalar dependências essenciais ---
log_info "Instalando dependências essenciais (Python, pip, git)..."
sudo apt install -y $PYTHON_VERSION $PYTHON_VERSION-venv $PYTHON_VERSION-pip git || log_error "Falha ao instalar dependências."

# --- 3. Criar usuário e grupo para o serviço ---
log_info "Criando usuário e grupo para o serviço cuxinho_user..."
sudo id -g cuxinho_user &>/dev/null || sudo groupadd cuxinho_user || log_error "Falha ao criar grupo cuxinho_user."
sudo id -u cuxinho_user &>/dev/null || sudo useradd -r -g cuxinho_user -s /sbin/nologin cuxinho_user || log_error "Falha ao criar usuário cuxinho_user."

# --- 4. Clonar o repositório da aplicação ---
log_info "Clonando o repositório da aplicação Cuxinho..."
if [ -d "$APP_DIR" ]; then
    log_info "Diretório $APP_DIR já existe. Removendo para clonar novamente."
    sudo rm -rf "$APP_DIR"
fi
sudo git clone https://github.com/nelsonrsmacedo-nrsm/Cuxinho.git "$APP_DIR" || log_error "Falha ao clonar o repositório. Verifique a URL e permissões."

# --- 5. Ajustar permissões do diretório da aplicação ---
log_info "Ajustando permissões do diretório da aplicação para cuxinho_user..."
sudo chown -R cuxinho_user:cuxinho_user "$APP_DIR" || log_error "Falha ao ajustar permissões do diretório da aplicação."

# Criar o diretório do banco de dados e ajustar permissões
log_info "Criando diretório do banco de dados e ajustando permissões..."
sudo mkdir -p "$APP_DIR/src/database" || log_error "Falha ao criar diretório do banco de dados."
sudo chown cuxinho_user:cuxinho_user "$APP_DIR/src/database" || log_error "Falha ao ajustar permissões do diretório do banco de dados."

# Criar o diretório de logs para o Gunicorn e ajustar permissões
log_info "Criando diretório de logs para o Gunicorn e ajustando permissões..."
sudo mkdir -p /var/log/cuxinho || log_error "Falha ao criar diretório de logs do Gunicorn."
sudo chown cuxinho_user:cuxinho_user /var/log/cuxinho || log_error "Falha ao ajustar permissões do diretório de logs do Gunicorn."

# --- 6. Configurar ambiente virtual ---
log_info "Configurando ambiente virtual Python..."
sudo $PYTHON_VERSION -m venv "$APP_DIR/venv" || log_error "Falha ao criar ambiente virtual."

# --- 7. Instalar dependências Python ---
log_info "Instalando dependências Python do requirements.txt..."
sudo "$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt" || log_error "Falha ao instalar dependências Python."

# --- 8. Instalar Gunicorn ---
log_info "Instalando Gunicorn no ambiente virtual..."
sudo "$APP_DIR/venv/bin/pip" install gunicorn || log_error "Falha ao instalar Gunicorn."

# --- 9. Inicializar o banco de dados (se necessário) ---
log_info "Inicializando o banco de dados (se necessário)..."
# O Flask-SQLAlchemy cria o banco de dados na primeira execução se não existir.
# Para garantir que o usuário admin padrão seja criado, podemos rodar o main.py uma vez.
# Desativar o modo de depuração para a execução inicial.
export FLASK_DEBUG=0
log_info "Iniciando temporariamente a aplicação para inicializar o banco de dados..."
sudo -u cuxinho_user bash -c "source \"$APP_DIR/venv/bin/activate\" && \"$APP_DIR/venv/bin/$PYTHON_VERSION\" \"$APP_DIR/src/main.py\"" & 
PID=$!
sleep 15 # Dar tempo para o Flask iniciar e criar o banco/usuário
log_info "Encerrando o processo de inicialização do banco de dados (PID: $PID)..."
kill -TERM $PID # Envia sinal de término para o processo
wait $PID 2>/dev/null # Espera o processo terminar, ignorando erros se já estiver morto
unset FLASK_DEBUG

# Garantir que a porta 5000 esteja livre de qualquer processo remanescente
log_info "Verificando e liberando a porta 50000, se estiver em uso..."
sudo fuser -k 50000/tcp || true # Mata qualquer processo usando a porta 50000
sleep 2 # Pequena pausa para garantir que a porta seja liberada

# --- 10. Configurar serviço Systemd ---
log_info "Configurando serviço Systemd para o Cuxinho..."

SERVICE_FILE="/etc/systemd/system/cuxinho.service"
sudo bash -c "cat > $SERVICE_FILE <<EOF
[Unit]
Description=Cuxinho Flask Application
After=network.target

[Service]
User=cuxinho_user
Group=cuxinho_user
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/venv/bin/gunicorn -w 4 -b 0.0.0.0:50000 src.main:app --error-logfile /var/log/cuxinho/gunicorn-error.log --access-logfile /var/log/cuxinho/gunicorn-access.log
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload || log_error "Falha ao recarregar daemon do Systemd."
sudo systemctl enable cuxinho || log_error "Falha ao habilitar serviço cuxinho."
sudo systemctl start cuxinho || log_error "Falha ao iniciar serviço cuxinho."

log_info "Verificando status do serviço Cuxinho..."
sudo systemctl status cuxinho

log_info "Instalação do Cuxinho concluída com sucesso!"
log_info "A aplicação deve estar acessível em http://<IP_DO_SEU_SERVIDOR>:50000"
log_info "Você pode verificar os logs com: journalctl -u cuxinho.service -f"

# Desativar ambiente virtual (se estiver ativo)
if [ "$(basename -- $VIRTUAL_ENV)" = "venv" ]; then
    deactivate
fi

