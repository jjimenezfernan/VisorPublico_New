FROM node:latest as node_build

# Argumentos
ARG NAME_DIRRECTORY=dirrectorio_arg
ARG NODE_ENV=env
ARG PORT=port

# Instalar Utilidades 
# Para comandos como cat, nano, mc, htop, git, ps y otros
ENV PORT=$PORT
ENV NODE_ENV=$NODE_ENV

# Copia todo el directorio con el código de la api
COPY ./servers_backend/$NAME_DIRRECTORY/ app/$NAME_DIRRECTORY/

# Establece el directorio de trabajo
WORKDIR /app/$NAME_DIRRECTORY/

# Instalar las dependencias del server de la aplicación React
#RUN npm install -g npm@latest
RUN npm install
# Para solucionar problemas de seguridad
# RUN npm audit fix --force

FROM node:23-alpine3.19 as node_final

ENV PORT=$PORT
ENV NODE_ENV=$NODE_ENV

COPY --from=node_build ./app/$NAME_DIRRECTORY/ app/$NAME_DIRRECTORY/
RUN apk update && \
    apk upgrade && \
    apk add --no-cache bash && \
    apk add --no-cache nano && \
    apk add --no-cache vim && \
    apk add --no-cache coreutils && \ 
    apk add --no-cache procps

# Al iniciar el contenedor, ejecuta el servidor de la aplicación React, ver el docker-compose.yml
CMD ["node", "server.js"]
