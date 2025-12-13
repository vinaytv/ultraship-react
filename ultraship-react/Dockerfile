# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Pass build-time env (Railway/Render will inject VITE_API_BASE_URL if set)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
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
