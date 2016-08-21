# Readme
A project to make people possess their own data again.

# To install a Gitlab over Ubuntu 14.04:
- sudo apt-get install vim postfix mailutils libsasl2-2 ca-certificates libsasl2-modules
- open /etc/postfix/main.cf to add relayhost = [smtp.gmail.com]:587; smtp_sasl_auth_enable = yes; smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd; smtp_sasl_security_options = noanonymous; smtp_tls_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem; smtp_tls_key_file=/etc/ssl/private/ssl-cert-snakeoil.key; smtp_use_tls=yes
- open /etc/postfix/sasl_passwd to add [smtp.gmail.com]:587 whigi.com@gmail.com:nNP36gFYmMeND3dIoKwR
- sudo chmod 400 /etc/postfix/sasl_passwd
- sudo postmap /etc/postfix/sasl_passwd
- sudo /etc/init.d/postfix reload

- sudo apt-get install curl openssh-server
- curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash
sudo apt-get install gitlab-ce
- sudo vim /etc/gitlab/gitlab.rb to change external url first line!
- sudo gitlab-ctl reconfigure

Then browse to your gitlab server usring HTTP to set everything up :)

# Launch
- Compile all TS files into JS files. Do not worry about non finding 'Promise', we run node v4.5, so we cannot build against ES6. Launching the compile script from the Whigi directory on Windows should do.
- Just issue node index.js over the several servers
- Static servers are described by a nginx configuration file
- Don't forget to prepare database using the mongoInit.sh file!

# Data model
- Whigi
   - Users are stored in a table with their basic profile info and a data array of all id's of their own infos in documents.
   - Documents are stored in another table, alongside.
- Whigi-restore
   - User_id <=> master_key bijection. This database is populated upon user creation bu Whigi, to communicate servers encrypt a welcoming message and the message. This encryption shared key is obviously of the utmost importance.