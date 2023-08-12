FROM node:lts-alpine3.18
WORKDIR /app
COPY package*.json  ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 1994
CMD ["node", "dist/main.js"]