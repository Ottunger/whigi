# Readme
A project to make people possess their own data again.
The clients should log in using generated token, for ease of unlogging all other clients.
The clients that remember a token should also remember a combination hash(password + salt), that is able to decrypt the encrypted master key.
Remember that clients aure authenticated using a match on hash(hash(password) + salt)

# See CHANGELOG for a description fof API endpoints.
Note that whigi-restore gets informed of the mappings email <=> master\_key but nevers informs back whigi of the disclosure. A front-end app should therefore request the master\_key then ask whigi for a password change.

# To install a Gitlab over Ubuntu 14.04:
- sudo apt-get install vim postfix mailutils libsasl2-2 ca-certificates libsasl2-modules
- open /etc/postfix/main.cf to add relayhost = [smtp.gmail.com]:587; smtp\_sasl\_auth\_enable = yes; smtp\_sasl\_password\_maps = hash:/etc/postfix/sasl\_passwd; smtp\_sasl\_security\_options = noanonymous; smtp\_tls\_cert\_file=/etc/ssl/certs/ssl-cert-snakeoil.pem; smtp\_tls\_key\_file=/etc/ssl/private/ssl-cert-snakeoil.key; smtp\_use\_tls=yes
- open /etc/postfix/sasl\_passwd to add [smtp.gmail.com]:587 whigi.com@gmail.com:nNP36gFYmMeND3dIoKwR
- sudo chmod 400 /etc/postfix/sasl\_passwd
- sudo postmap /etc/postfix/sasl\_passwd
- sudo /etc/init.d/postfix reload

- sudo apt-get install curl openssh-server
- curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash
sudo apt-get install gitlab-ce
- sudo vim /etc/gitlab/gitlab.rb to change external url first line!
- sudo gitlab-ctl reconfigure

Then browse to your gitlab server usring HTTP to set everything up :)

# Launch
Best practice now is to use npm, issuing npm run build, npm run whigi, npm run whigi-restore.
- Compile all TS files into JS files. Do not worry about non finding 'Promise', we run node v4.5, so we cannot build against ES6.
- Just issue node index.js over the several servers
- Static servers are described by a nginx configuration file
- Don't forget to prepare database using the mongoInit.sh file!

# Data model
- Whigi
   - Users are stored in a table with their basic profile info and a data array of all id's of their own infos in documents.
   - Documents are stored in another table, alongside.
- Whigi-restore
   - User\_id <=> master\_key bijection. This database is populated upon user creation bu Whigi, to communicate servers encrypt a welcoming message and the message. This encryption shared key is obviously of the utmost importance.