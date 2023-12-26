FROM node:20.10-alpine
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH
COPY package*.json ./

RUN npm install
RUN npm install -g nodemon

ENTRYPOINT ["sh", "./entrypoint.sh"]