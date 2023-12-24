FROM node:20.10-alpine
WORKDIR /app
COPY package*.json index.js ./

RUN npm install --silent
CMD [ "node", "index.js" ]