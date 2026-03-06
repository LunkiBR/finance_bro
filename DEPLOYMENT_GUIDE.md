# 🚀 Guia Definitivo de Deploy - Finance Friend na VPS

Este guia explica como a arquitetura do servidor está montada, o que cada componente faz, e qual é o passo a passo exato para garantir que qualquer alteração de código seja refletida no site ao vivo (produção).

---

## 🏗️ 1. Entendendo a Arquitetura (O que roda por trás do site)

Atualmente, o site **não roda diretamente na VPS** (como rodaria usando PM2 ou `npm run start` solto no servidor). Em vez disso, ele usa a arquitetura de **Containers Docker e Reverse Proxy**. 

Por que? Porque isso permite que a gente rode o banco de dados, a inteligência artificial (n8n), o Traefik e o site em "caixinhas separadas" (containers) que não interferem umas nas outras, tornando o sistema infinitamente mais profissional e escalável.

A estrutura é a seguinte:

1. **Internet (Cloudflare)**: O usuário digita `finance.elytraai.com.br` e o tráfego bate no servidor através da Cloudflare.
2. **Proxy Reverso (Traefik)**: É o "porteiro" do servidor. Ele recebe o tráfego nas portas 80 (HTTP) e 443 (HTTPS). Ele lê qual domínio está sendo acessado e encaminha a requisição para a "caixinha" correta. Ele também gera os certificados SSL (cadeado verde) automaticamente.
3. **Container do App (Docker)**: O seu código Next.js (`finance-app`) foi compilado e envelopado dentro de um container Docker. Esse container apenas "fala" com a porta 3000 interna. O Traefik sabe que o domínio `finance` deve apontar para essa porta 3000.

**O ERRO ANTERIOR EXPLICADO:**
O script antigo usava `pm2 restart`. O PM2 estava, de fato, pegando o código novo e rodando na VPS. **Porém**, o Traefik (que é quem responde pelos acessos externos de quem entra no site) estava conectado exclusivamente e ignorando o PM2. O Traefik estava ouvindo apenas a imagem do Docker antiga, que subiu há dias atrás, não o processo local do PM2. Por isso o código local atualizava, mas a tela do usuário não. 

A partir de agora, o nosso deploy reconstrói a imagem do Docker, trocando o container antigo pelo novo de forma suave.

---

## 🛠️ 2. O Processo de Deploy (Passo a Passo)

Para que uma alteração vá para o ar, você só precisa concluir 2 etapas fundamentais:
1. Enviar o código da sua máquina para o GitHub (Push).
2. Entrar na máquina do servidor (VPS) e mandar ele puxar o código do GitHub e Reconstruir a imagem.

### Etapa 1: Máquina Local (Seu PC)

Você fez as alterações e quer enviá-las para produção:

1. Salve tudo.
2. Abra o terminal na pasta `finance-app`.
3. Rode:
   ```bash
   git add .
   git commit -m "feat: alterei a cor do botão"
   git push origin main
   ```
   *Isso pega o código do seu PC e joga na nuvem (GitHub).*

### Etapa 2: Servidor de Produção (VPS Hostinger)

Com o código no GitHub, precisamos avisar a VPS.

1. Conecte-se na sua VPS usando SSH:
   ```bash
   ssh root@srv1091457.hstgr.cloud
   ```
   *(Sua senha / chave)*

2. Entre na pasta correta do projeto onde a VPS sabe lidar com infraestrutura:
   ```bash
   cd /var/www/finance-app
   ```

3. Execute o script de Deploy automático que acabei de criar:
   ```bash
   ./deploy-vps.sh
   ```

**O que esse script faz automaticamente?**
Ele vai rodar literalmente isto:
- `git pull origin main` → Puxa as novidades do Github pra pasta da VPS.
- `docker compose -f docker-compose.finance.yml build --no-cache` → Ele baixa o Node.js novo num ambiente zerado, roda o instalador de pacotes (`npm ci`), faz o BUILD do Next.js copiando só as novidades, e cria uma nova "foto" (imagem) do seu site.
- `docker compose -f docker-compose.finance.yml up -d` → Ele desliga o site antigo e substitui por essa nova "foto". A partir deste milésimo de segundo, o Traefik já percebe a mudança e serve o site novo para os clientes. Tudo invisível para o usuário final.
- `docker image prune -f` → Limpa as "fotos" antigas para não lotar o SSD da sua VPS.

---

## 🚨 Dicas Adicionais

- **Se der erro de Script `Permission Denied`**:
  Caso tente rodar `./deploy-vps.sh` e o linux reclame de permissão, diga a ele que o script é um executável:
  ```bash
  chmod +x deploy-vps.sh
  ```

- **Para ver os bastidores do site (Logs em tempo real)**:
  Se quiser ver os acessos do Next.js ou erros que estouram apenas no servidor, logue na VPS, vá para `/var/www/finance-app` e rode:
  ```bash
  docker logs -f finance-app-finance-app-1
  ```
  Isso mostrará o painel clássico do console do Next.

- **Cadê o PM2?**
  Nós abolimos o PM2 neste ambiente de produção em prol do Docker. O Docker garante que o site rodem com o EXATO mesmo sistema operacional Alpine, EXATA mesma versão de NodeJS v20 que ele foi testado, abolindo para sempre a frase "Na minha máquina funciona, no servidor não". O PM2 é excelente para APIs rápidas de scripts JS soltos, mas falha em isolamento.
