# Etapa de Build (compilación de React/Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Declara el argumento de build que se pasará desde docker-compose o el comando docker build
# Este es el URL que el frontend usará para contactar al backend.
# Debe ser el URL accesible desde el navegador del usuario (ej: http://localhost:3000/api)
ARG VITE_BACKEND_URL

# Establece la variable de entorno para que esté disponible durante el proceso de build de Vite
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Copia package.json y package-lock.json para aprovechar el caché de Docker.
# Solo se reinstalarán dependencias si estos archivos cambian.
COPY package*.json ./

# Se recomienda 'npm ci' para builds más rápidos y reproducibles basados en package-lock.json
# Asegúrate de que package-lock.json esté actualizado y sea consistente con package.json.
RUN npm ci

# Copia el resto de los archivos de la aplicación.
# Asegúrate de tener un archivo .dockerignore para excluir node_modules, .git, etc.
COPY . .

# Construye la aplicación para producción.
# Vite usará VITE_BACKEND_URL de las variables de entorno.
RUN npm run build

# Etapa de Producción (servir con Nginx)
FROM nginx:1.25-alpine

# Elimina la configuración por defecto de Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copia tu archivo de configuración personalizado de Nginx.
# Este archivo debe estar en el contexto de build (junto al Dockerfile).
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Ejemplo de nginx.conf para una SPA React/Vite:
# server {
#   listen 80;
#   server_name localhost;
#
#   root /usr/share/nginx/html;
#   index index.html;
#
#   location / {
#     try_files $uri $uri/ /index.html;
#   }
# }

# Copia los archivos estáticos construidos desde la etapa 'build' al directorio raíz de Nginx.
# Asegúrate de que la carpeta de salida de tu build (RUN npm run build) sea '/app/dist'.
COPY --from=build /app/dist /usr/share/nginx/html

# Expone el puerto 80 (HTTP)
EXPOSE 80

# Comando para iniciar Nginx en primer plano (requerido por Docker)
CMD ["nginx", "-g", "daemon off;"]