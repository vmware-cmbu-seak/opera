FROM nginx:latest
EXPOSE 443
COPY nginx.conf /etc/nginx/nginx.conf
COPY webcert /opt/webcert
COPY webroot /opt/webroot
ENV SERVICE_MODULE="nginx"