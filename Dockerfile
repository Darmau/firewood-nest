FROM node:20.0.0-alpine3.17
WORKDIR /app
COPY package*.json  ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 1994
CMD ["node", "dist/main.js"]