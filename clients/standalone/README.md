# Standalone client
Here should lie files that make up our website, front-end site. Not the plugins for integration, but our website for users to (rarely) create an account, but most probably check and change their owned data.
We should use static html/js files described by an nginx.conf file

# In dev time
- In dev time, the adresses of the API are set to "localhost", those can be found in app/app.service.ts and should be changed!
- To launch, either create a small nginx.conf file, or use lite-server in node_modules\.bin, once dependencies resolved by npm.