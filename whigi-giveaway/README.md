# Whigi giveaway
Whigi giveaway is a mechanism for granting Wordpress sites to people freely. Using their Whigi account, people will be able to set up a brand new
instance already preconfigured.

It assumes to be running in a non-critical machine, at Envict, it will be hosted over a virtualized Ubuntu. All request to this .\*.envict.com where .\* is not
known should therefore be translated to this machine. A root nginx on this machine will then dispatch amongst the several apache2 virtual servers, that all run on a
different port.

Of course, you will need to do a little bit of setup:
- This package expects to be installed at whigi2-giveaway.envict.com. It also expects Whigi to be available at whigi2-demo.envict.com.
- Add php7 repo: sudo apt-get install python-software-properties && sudo LC_ALL=C.UTF-8 add-apt-repository ppa:ondrej/php && sudo apt-get update
- Install apache2 mysql-server mysql-client php7.0-cli php7.0-common libapache2-mod-php7.0 php7.0 php7.0-mysql php7.0-fpm php7.0-curl php7.0-gd php7.0-bz2 php7.0-mbstring php7.0-xml [using apt-get]
- When installing mysql, set the root password to be 'abcdefgh', as whigi-giveaway expects.
- Install mongo database v3.2.X and node v4.7.X.
  - sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
  - echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
  - sudo apt-get update
  - sudo apt-get install -y mongodb-org
  - curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -
  - sudo apt-get install nodejs
- Using mysql, create a wordpress user and a wordpress database
  - CREATE USER 'wpshit'@'localhost' IDENTIFIED BY 'shitty';
  - GRANT ALL PRIVILEGES ON * . * TO 'wpshit'@'localhost';
  - FLUSH PRIVILEGES;
- Modify apache2 php.ini file (/etc/php/7.0/apache2/php.ini) to enable mods .so only, not .dll if not already done!: php\_curl, php\_gd2, php\_mbstring and php\_pdo\_mysql.
- Set php7 modules for apache: sudo a2enmod proxy_fcgi setenvif && sudo a2enconf php7.0-fpm && sudo service apache2 reload
- Load ssl module: sudo a2enmod ssl
- Download the zip archive of wordpress, and extract its contents to /home/gregoire/wordpress.
- Download wp-force-https https://downloads.wordpress.org/plugin/wp-force-https.0.1.2.zip, and unzip it to /home/gregoire/wordpress/wp-content/plugins
- Clone this repo, delete already installed plugins and and copy the plugins from clients/whigi-wp and clients/whigi-wp-s2 to /home/gregoire/wordpress/wp-content/plugins

- Put the private key and certificate file from \*.envict.com to /home/gregoire folder.
- You should install wp-cli and make sure that it is available as 'wp' from command line.
  - curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
  - chmod +x wp-cli.phar
  - sudo mv wp-cli.phar /usr/local/bin/wp

- Change your /etc/apache2/ports.conf file so that it has but: Listen 81
- Reload apache

- Start this website:
  - Install dependencies: npm install
  - Build all whigi: npm run build
  - Run the API server: nohup npm run whigi-giveaway &
  - Start serving requests: npm run serve-giveaway