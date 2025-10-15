# Configuración de Nginx y docker de Node para el Visor Publico de la EMSV

**En primer lugar, para poder entender esta parte es obligatorio haber examinado el repostorio [Web-Server-NGINX-PHPFPM](https://github.com/KhoraUrbanThinkers/Web-Server-NGINX-PHPFPM), adémas de ser de vital importancia enteder el apartado [Introducción de una nueva página web en el servidor web](https://github.com/KhoraUrbanThinkers/Web-Server-NGINX-PHPFPM/tree/main/Docker_Nginx#introducci%C3%B3n-de-una-nueva-p%C3%A1gina-web-en-el-servidor-web)**

Este dirrectorio contiene los pasos para subir el visor a nuestro servidor Kutone, además del código para ejecutar el docker del servidor de *nodejs*.

### Organización del Proyecto
A continuación, la organización del directorio:
- [imagen_js_server](./imagen_js_server/), contiene la imagen para poder subir el *server* de la página web, destacar que en el directorio [./servers_backend/visor_publico_emsv_server](./imagen_js_server/servers_backend/visor_publico_emsv_server/) habrá que añadir los archivos del *server* de la página, en este caso serán, el directorio *resources* y los archivos *package-lock.json*, *package.json* y *server.js*.
- [visor_publico_emsv_client](./visor_publico_emsv_client/), contiene los archivos *html*, *css*, *javascript* y *assets* para la página web, en este caso, los archivos del directorio *dist* creada por el comando `npm run buil` ejecutado en el directorio *client*. 
- [backend-visor-publico-emsv-upstreamconf](./backend-visor-publico-emsv-upstream.conf), contiene la configuración del servidor *upstream* de la configuración de *nginx*.
- [visorpublicoemsv.khoraurbanthinkers.es.conf](./visorpublicoemsv.khoraurbanthinkers.es.conf), contiene la configuración de la página web para que *nginx* pueda servirla.
- [docker-compose.yml](./docker-compose.yml), archivo para poder levantar el servidor de *nodejs* que sirve los archivos a la página web en un *docker*.
