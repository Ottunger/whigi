# Readme
A project to make people possess their own data again.
The clients should log in using generated token, for ease of unlogging all other clients.
The clients that remember a token should also remember a combination hash(password + salt), that is able to decrypt the encrypted master key.
Remember that clients aure authenticated using a match on hash(hash(password) + salt)

# See CHANGELOG for a description fof API endpoints.
Note that whigi-restore gets informed of the mappings email <=> master\_key but nevers informs back whigi of the disclosure. A front-end app should therefore request the master\_key then ask whigi for a password change.

# Third-parties
- USING THE REQUEST FOR GRANT: This is the most promoted method. You do not need to register anything special to Whigi, a simple account with a mail will do.
When a user has for instance bought something on your website, just send them to
/grant/encodeURIComponent([your-email])/encodeURIComponent([//-separated-list-of-data])/encodeURIComponent([return\_url\_ok])/encodeURIComponent([return\_url\_deny]) . Upon selection, the user will be redirected
to one of the two URL's, the "ok" one if the intersection of all the data you asked for and the user's data can be granted, the "deny" if the user denied you
access or if something went wrong.
- USING THE API: In order to not polute the namespace of applications data names if you have a plugin that needs specific data, please record data as named
/apps/[your-specific-app-name]/whatever . Please note that we plan on having generic information that a user might usually share stored in
a standardized path, we suppose profile/often-shared-data
- USING OAUTH: Whigi is not meant to be used with OAuth. That said, we provide OAuth for ease, but using OAuth will give you the user's master key, thus making you as responsible
as a third-party not using it. You will need to register to a Whigi provider by your own means (email, ...) to get a valid "for_id".
When registering you will need to provide an URL that Whigi can call to ensure you are the one who made the request with check-token. It should return a JSON response containing a key
success set to either true or false. It should accept a GET request where the token will be given by ?token= in query parameters.

We therefore restrict what can be done using OAuth:
  - Only read-only access can be given
  - Only one data or folder at a time
  - To use it, send your user to /oauth/[your-for\_id]/encodeURIComponent([the-data-you-need])/[check-token]/encodeURIComponent([return\_url\_ok])/encodeURIComponent([return\_url\_deny])
  - On grant, the url will be browsed to with query parameters: token, the access token & key_decryption, a key that allows to decrypt the encrypted master key of the user.
    Apply toBytes (see out code) first on it, before using it as AES256 key.
  - On deny, the url will be browsed to with query parameter: reason, can be one of 'deny', 'https' (We only allow HTTPS return URL's), or 'api' (our server failed)

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
Whigi runs over HTTP because it is behind nginx that makes the HTTPS handshake. Whigi-restore and Whigi-RLI run their own HTTPS.

# Data model
- Whigi
   - Users are stored in a table with their basic profile info and a data array of all id's of their own infos in documents.
   - Documents are stored in another table, alongside.
- Whigi-restore
   - User\_id <=> master\_key bijection. This database is populated upon user creation bu Whigi, to communicate servers encrypt a welcoming message and the message. This encryption shared key is obviously of the utmost importance.

# To have a possibly growing website
Whigi is based on a CDN for data architecture, or Data-Grid.
All Whigi instances are nodes that periodically update RLI's (Resource Location Indices) about the data they have. These RLI's are hard coded in a JSON file, but as
the file is reloaded each time an update is made, it can change on the server without reboot.
It is the responsibility of the RLI's to accept and process updates. They stamp incoming modifications with a timestamp in order to resolve
newer version of data and push those updates to the other Whigi instances they know to have it.
All the information the RLI's have are soft-stated: they disappear if not refreshed by the updater that we assumed to have died.
If you want to modify/rebuild the message definitions, you will need to download protoc for Google Protobufs v3.0.0 manually, from GitHub.
The source and compiled messages definitions are stored in common/cdnize.

# Peer monitoring
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