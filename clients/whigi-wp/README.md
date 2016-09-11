# Installing WP HTTPS over Ubuntu
To work with Whigi, you will need a HTTPS version of your site. In the case of WP, it is relatively easy to install:
- Add php7 repo: sudo apt-get install python-software-properties && sudo LC_ALL=C.UTF-8 add-apt-repository ppa:ondrej/php && sudo apt-get update
- Install apache2 mysql-server mysql-client php7.0-cli php7.0-common libapache2-mod-php7.0 php7.0 php7.0-mysql php7.0-fpm php7.0-curl php7.0-gd php7.0-bz2 php7.0-mbstring php7.0-xml [using apt-get]
- Modify apache2 php.ini file (/etc/php/7.0/apache2/php.ini) to enable mods .so only, not .dll if not already done!: php\_curl, php\_gd2, php\_mbstring and php\_pdo\_mysql.
- Set php7 modules for apache: sudo a2enmod proxy_fcgi setenvif && sudo a2enconf php7.0-fpm && sudo service apache2 reload
- Download the zip archive of wordpress, and extract its contents to /var/www/html, erasing index.html
- Using mysql, create a wordpress user and a wordpress database
  - CREATE USER 'wpshit'@'localhost' IDENTIFIED BY 'shitty';
  - GRANT ALL PRIVILEGES ON * . * TO 'wpshit'@'localhost';
  - FLUSH PRIVILEGES;
  - CREATE DATABASE wordpress;
- Browse your site over HTTP, and install WP
- Go to general settings, and set your URL's to be HTTPS
- Load ssl module: sudo a2enmod ssl
- Copy /etc/apache2/sites-available/000-default.conf to, say, /etc/apache2/sites-available/001-default.conf
- Assign HTTPS port: sudo sed -i '1,2s/\*:80/*:443/' 001-default.conf
- Assign certificate and key: sudo sed -i "3a\\\tSSLEngine On\n\tSSLCertificateFile /your/certificate.pem\n\tSSLCertificateKeyFile /your/key.key" 001-default.conf
- Make it a site "sudo a2ensite 001-default.conf" and reload
- Install the plugin folder into /car/www/html/wp-content/plugins

If you are behind nginx, don't forget to configure it as a transparent proxy for HTTPS as well, as it is apache that will be the HTTPS endpoint.