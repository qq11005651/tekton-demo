# nginx-demo 演示镜像：基于 nginx 1.15.2 静态站点
# 平台默认镜像：hub.podcc.com/test/nginx:1.15.2
FROM nginx:1.15.2-alpine
LABEL org.opencontainers.image.source="https://github.com/qq11005651/tekton-demo.git"
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
