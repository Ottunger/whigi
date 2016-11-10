# Readme
A project to make people possess their own data again.
The clients should log in using generated token, for ease of unlogging all other clients.
The clients that remember a token should also remember a combination hash(password + salt), that is able to decrypt the encrypted master key.
Remember that clients are authenticated using a match on hash(hash(password) + salt).
To generate email templates for the whigi-restore, check https://html-online.com/editor/.

# Projects
Whigi repo is actually a collection of projects working for the Whigi project initially. Larger 3rd parties shall start a new project on their own.
- Whigi @whigi: Manages the backend of the storage solution
- Whigi-giveaway @whigi-giveaway: Manages a small website to grant people access to free WP instances, populated for Whigi.
- Whigi-restore @whigi-restore: Manages a small 3rd party to restore user's passwords.
- Whigi-RLI @whigi-rli: Network nodes to provide Whigi redundancy.
- Whigi-CC @whigi-cc: Another form of redundancy based on Captain Cook.


# Installation of Whigi and Standalone client
All Whigi instances run over HTTPS. Whigi-CC and Whigi-RLI are their own HTTPS providers, often over 4443, whereas Whigi, Whigi-restore and Whigi-giveaway are behind nginx.
- Clone the gitlab repository.
- Make sure to have installed node=4.7.X, mongo=3.2.X, nginx>=1.6.X. (A how to can be found in whigi-giveaway/README.md)
- Modify the nginx.conf package to specify where you cloned your repo and the path to logs. Be careful where the HTTPS endpoint is! Especially if running several nginx in chain.
- Modify package.json, the script "whigi", to specify the hostname of Whigi-restore to Whigi and vice versa, if they do not both run on the same machine.
- Install npm dependencies: npm install
- Compile all (do not worry about non finding Promise, Buffer, etc): npm run build
- Init database: mongo < mongoInit.sh
- Launch Whigi: nohup npm run whigi &
- Copy conf file and restart nginx: npm run serve
- Install RabbitMQ if you want to use CDN
  - gpg --keyserver pgpkeys.mit.edu --recv-key 7638D0442B90D010
  - gpg -a --export 7638D0442B90D010 | sudo apt-key add -
  - echo 'deb http://ftp.debian.org/debian wheezy-backports main' | sudo tee /etc/apt/sources.list.d/wheezy_backports.list
  - wget -O- https://packages.erlang-solutions.com/debian/erlang_solutions.asc | sudo apt-key add -
  - echo 'deb https://packages.erlang-solutions.com/debian wheezy contrib' | sudo tee /etc/apt/sources.list.d/esl.list
  - echo 'deb http://www.rabbitmq.com/debian/ testing main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
  - wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc | sudo apt-key add -
  - sudo apt-get update && sudo apt-get install init-system-helpers socat esl-erlang && sudo apt-get install rabbitmq-server
  - The RabbitMQ broker should be clustered, and publicly available at an IP/name stated in endpoints.json
- Launch Whigi-restore/Whigi-giveaway and Whigi-RLI/Whigi-CC if desired. They cannot run on the machine as they will listen on port 443!: nohup npm run whigi-XXX &

# See CHANGELOG for a description of API endpoints.
A greater description is given in the documents found in the doc folder.
Please make sure to update password when you recover it (create a client that does so).

# Third-parties
- CAREFUL THIRS PART OF THE DOC MIGHT NOT BE UP TO DATE, CHECK THE LATEST API REPO. ALTHOUGH THOSE STILL WORK, BETTER URL EXIST!
- SIMULATE AN ACCOUNT CREATION WITHOUT OAUTH: This is the best method for account creation. Make your user browse to
/account/encodeURIComponent([your-ID])/encodeURIComponent([return\_url\_ok])/encodeURIComponent([return\_url\_deny])/true. This will create a new dummy data in the user's file named
keys/auth/[your-ID], and share it with you. To log in a user, make him browse to /remote/encodeURIComponent([your-ID])/[challenge]/encodeURIComponent([return\_url]). The URL
will be visited back with URL query parameters "user", the ID of the user, and "response", your challenge (should be letters and digits) encrypted with the shared
data you now share with the user. This can be null if no such account exists on our side. You can then just check that this is indeed what you get by decrypting your vault for this ID,
recover the shared key, and decrypt to match against your challenge.
- USING THE REQUEST FOR GRANT: This is the most promoted method. You do not need to register anything special to Whigi, a simple account with a mail will do.
When a user has for instance bought something on your website, just send them to
/account/encodeURIComponent([your-ID])/encodeURIComponent([return\_url\_ok])/encodeURIComponent([return\_url\_deny])/false/encodeURIComponent([//-separated-list-of-data])
/[expire\_epoch]/encodeURIComponent([trigger\_url]) .
Upon selection, the user will be redirected to one of the two URL's, the "ok" one if the intersection of all the data you asked for and the user's data can be granted,
the "deny" if the user denied you access or if something went wrong.
- USING THE API: In order to not polute the namespace of applications data names if you have a plugin that needs specific data, please record data as named
/apps/[your-ID]/whatever . Please note that we plan on having generic information that a user might usually share stored in
a standardized path, we suppose profile/often-shared-data
- USING OAUTH: Whigi is not meant to be used with OAuth. That said, we provide OAuth for ease, but using OAuth will give you the user's master key, thus making you as responsible
as a third-party not using it. You will need to register to a Whigi provider by your own means (email, ...) to get a valid "for_id".
When registering you will need to provide an URL that Whigi can call to ensure you are the one who made the request with check-token. It should return a JSON response containing a key
success set to either true or false. It should accept a GET request where the token will be given by ?token= in query parameters.

We therefore restrict what can be done using OAuth:
  - Only read-only access to a folder can be given
  - Critical write acces can be given for single data
  - Writes/grants are limited to a per file basis (still allows apps such as calendars to work)
  - Only one data or folder at a time
  - To use it, send your user to /oauth/[your-for\_id]/encodeURIComponent([the-data-you-need])/[check-token]/encodeURIComponent([return\_url\_ok])/encodeURIComponent([return\_url\_deny])
  - On grant, the url will be browsed to with query parameters: token, the access token & key_decryption, a key that allows to decrypt the encrypted master key of the user.
    Apply toBytes (see out code) first on it, before using it as AES256 key.
  - On deny, the url will be browsed to with query parameter: reason, can be one of 'deny', 'https' (We only allow HTTPS return URL's), or 'api' (our server failed)

# To install an Ajenti over Ubuntu 14.04:
- wget -O- https://raw.github.com/ajenti/ajenti/1.x/scripts/install-ubuntu.sh | sudo sh
However, Ajenti is its own HTTPS endpoint, so when behind nginx, make sure that the last connection is done using HTTPS.
Ajenti will also look at the remote host providing requests, so make sure to set the host header to $host in nginx.
The initial port is SSL8000 with username/password root/admin.

While configuring new modules for Ajenti, make sure to have python-dev and a plethora of libs installed.
Careful! The debug server runs over HTTP, but on the same port, you might want to vim into config.json to already turn on HTTPS!
Please beforehand install less and cf (npm install -g less coffee-script) and do "make run"

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

# Data model
- Whigi
   - Users are stored in a table with their basic profile info and a data array of all id's of their own infos in documents.
   - Documents are stored in another table, alongside.
   - Refer to the UML diagram for more information.
- Whigi-giveaway does not need to know about what is behind either, as the files are anyhow removed on override.
- Whigi-restore is the simpliest provider, and as such, does not even have a database!
- Whigi-CC/Whigi-RLI hold knowledge in RAM, as are soft-stated.

# To have a possibly growing website
Whigi is based on a CDN for data architecture, or Data-Grid.
All Whigi instances are nodes that periodically update RLI's (Resource Location Indices) about the data they have. These RLI's are hard coded in a JSON file, but as
the file is reloaded each time an update is made, it can change on the server without reboot.
It is the responsibility of the RLI's to accept and process updates. They stamp incoming modifications with a timestamp in order to resolve
newer version of data and push those updates to the other Whigi instances they know to have it.
All the information the RLI's have are soft-stated: they disappear if not refreshed by the updater that we assumed to have died.
If you want to modify/rebuild the message definitions, you will need to download protoc for Google Protobufs v3.0.0 manually, from GitHub.
The source and compiled messages definitions are stored in common/cdnize.
- protoc\bin\protoc.exe --js_out=import_style=commonjs,binary:. common\cdnize\full-update.proto

# Peer monitoring
Client side monitoring is done via auditing the retrieved HTTPS files. Because the server might still change their responses if they knew requests are coming from Whigi's,
any Whigi is free to use a proxy for retrieving the files, thus making sure the tested server will respond typically sent files. You can change your local proxy in the
file /common/cdnize/scripts/client.sh

Peer monitoring is enabled in the following way: all Whigi instances are reuired to run an FTP daemon, we would recommend vsFTPd.
The daemon must listen on the standard FTP port (ie, 21), and allow anyone to connect securely (ie, using SSL) in read only mode to the directory
containing the server files (ie, this level). All Whigi instances can then retrieve this counterpart and hash the files to their owns to check
for differences. Should any be spotted, they are entitled to inform RLI's. When an instance is flagged by two others at least, RLI's will
consider it biaised, and not advertise it anymore.

Please be careful, as this technique is not perfect: node_modules can still be changed at the moment, and if the attacker is able to forge FTP responses,
he could make sure the answers are always good... A better technique would be to allow SSH for only a predefined set of commands, among which:
- netstat to see if it's the good server answering
- a diff checker on site
Even though, those commands could have been replaced. The goal is thus to monitor soon enough for the attacker not to have the time to tamper this way.