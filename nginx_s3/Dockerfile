FROM nginx:latest

ENV TZ=Asia/Kolkata

RUN apt-get update \
    && apt-get install -y wget cron supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/$(cat /etc/timezone) /etc/localtime \
    && echo $(cat /etc/timezone) > /etc/timezone

COPY nginx.conf /etc/nginx/
COPY index.php /usr/share/nginx/html/
COPY minio_download_script.sh /usr/local/bin/minio_download_script.sh
COPY cronjob /etc/cron.d/minio_download
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc \
    && chmod +x /usr/local/bin/mc

RUN chmod +x /usr/local/bin/minio_download_script.sh

RUN chmod 0644 /etc/cron.d/minio_download

CMD ["/usr/bin/supervisord"]
