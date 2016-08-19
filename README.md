# Readme
A project to make people posess their own data again.

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

<<<<<<< HEAD
Then browse to your gitlab server usring HTTP to set everything up :)
=======
Then browse to your gitlab server usring HHTP to set everything up :)

# 
>>>>>>> c9fcacb98f1d35283f289281eb5b0e6b75205b9d
