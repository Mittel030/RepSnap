FROM php:8.4-apache

RUN a2enmod rewrite headers

RUN apt-get update && apt-get install -y libpng-dev libjpeg-dev libwebp-dev && rm -rf /var/lib/apt/lists/*
RUN docker-php-ext-configure gd --with-jpeg --with-webp \
 && docker-php-ext-install pdo pdo_mysql mysqli gd

RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

RUN echo "upload_max_filesize=100M\npost_max_size=100M\nmemory_limit=256M" > /usr/local/etc/php/conf.d/uploads.ini
