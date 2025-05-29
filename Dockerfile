# -------------------------------
# Stage 1: Build Angular
# -------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# 1. Instala TODAS las dependencias
COPY package.json package-lock.json ./
RUN npm ci

# 2. Copia el resto y compila producción
COPY . .
RUN npx ng build --configuration production

# -------------------------------
# Stage 2: Nginx para servir tu SPA
# -------------------------------
FROM nginx:stable-alpine AS production
WORKDIR /usr/share/nginx/html

# 3. Limpia el contenido por defecto de Nginx
RUN rm -rf ./*

# 4. Copia sólo la carpeta 'browser' (Angular 18) al root de Nginx
COPY --from=build /app/dist/rfp-indap/browser/ ./

# 5. Copia también estos archivos generados
COPY --from=build /app/dist/rfp-indap/3rdpartylicenses.txt ./
COPY --from=build /app/dist/rfp-indap/prerendered-routes.json ./

# 6. Tu configuración de rutas SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4300
CMD ["nginx", "-g", "daemon off;"]
