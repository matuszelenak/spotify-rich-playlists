FROM node:20.10-alpine as builder

ARG VITE_API_LINK
ENV VITE_API_LINK ${VITE_API_LINK}

ARG VITE_WS_LINK
ENV VITE_WS_LINK ${VITE_WS_LINK}

ARG VITE_SPOTIFY_CLIENT_ID
ENV VITE_SPOTIFY_CLIENT_ID ${VITE_SPOTIFY_CLIENT_ID}

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package*.json ./
RUN npm install --silent