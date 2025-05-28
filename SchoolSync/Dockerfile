# Etapa de Build (compilación de React/Vite)
FROM node:20-alpine AS build
WORKDIR /app

# Copia package.json y package-lock.json (o yarn.lock)
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto de los archivos de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# Etapa de Producción (servir con Nginx)
FROM nginx:1.25-alpine

# Elimina la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia tu archivo de configuración personalizado de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Si nombraste tu archivo de forma diferente (ej. my-custom-nginx.conf),
# asegúrate de que el nombre coincida aquí y que se copie a /etc/nginx/conf.d/default.conf o un archivo .conf en ese directorio.

# Copia los archivos estáticos construidos desde la etapa 'build' al directorio raíz de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expone el puerto 80
EXPOSE 80

# Comando para iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]