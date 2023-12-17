FROM node:20.10-alpine as builder

ARG VITE_API_LINK
ENV VITE_API_LINK ${VITE_API_LINK}

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package*.json ./
RUN npm install --silent