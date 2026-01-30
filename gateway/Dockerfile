FROM node:20-alpine

WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install --production

# Copia código do gateway
COPY . .

EXPOSE 9090

CMD ["node", "gateway.js"]