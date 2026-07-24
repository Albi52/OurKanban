FROM node:20 AS build

WORKDIR /frontend

COPY frontend/package*.json .

RUN node -v
RUN npm -v

RUN npm install

RUN npm list typescript
RUN ls -la node_modules/.bin | grep tsc || true

COPY frontend .

RUN npm run build


FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /frontend/dist /usr/share/nginx/html