# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve with port-aware static server
FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
ENV PORT=3000
EXPOSE 3000
# Railway/Render/Heroku inject PORT; default to 3000 if unset
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
