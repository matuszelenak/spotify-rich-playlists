FROM node:20.10-alpine as builder

ARG VITE_API_LINK
ENV VITE_API_LINK ${VITE_API_LINK}

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY package.json package-lock.json tsconfig.json index.html vite.config.js ./
COPY src src
COPY public public
RUN npm run build

FROM nginx:alpine as production

COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
