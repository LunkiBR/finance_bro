#!/bin/bash
# Finance Friend - VPS Deployment Script (Docker Version)
# Execute this on sua Hostinger VPS como root

echo "🚀 Iniciando Deployment do Finance Friend via Docker..."

# 1. Navegar para o diretório do projeto
cd /var/www/finance-app

# 2. Puxar código mais recente do GitHub
echo "📥 Puxando últimas alterações do GitHub (branch: main)..."
git pull origin main

# 3. Forçar o build da nova imagem Docker, sem usar cache
echo "⚙️ Reconstruindo a imagem Docker da aplicação (sem cache)..."
docker compose -f docker-compose.finance.yml build --no-cache

# 4. Levantar (ou recriar) o container com a nova imagem
echo "🔄 Reiniciando o container em background..."
docker compose -f docker-compose.finance.yml up -d

# 5. Limpeza de imagens antigas/inutilizadas (Opcional, mas recomendado na VPS)
echo "🧹 Limpando recursos não mais utilizados do Docker..."
docker image prune -f

echo "✅ Aplicação atualizada com sucesso e rodando dentro do Docker!"
echo "O Traefik cuidará do roteamento para a nova porta 3000 interna do container."
