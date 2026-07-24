FROM node:20 AS build
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --include=dev

COPY frontend .
RUN npm run build

FROM nginx:alpine
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /frontend/dist /usr/share/nginx/html
