# Whigi giveaway
Whigi giveaway is a mechanism for granting Wordpress sites to people freely. Using their Whigi account, people will be able to set up a brand new
instance already preconfigured.

It assumes to be running in a non-critical machine, at Envict, it will be hosted over a virtualized Ubuntu. All request to this .\*.envict.com where .\* is not
known should therefore be translated to this machine. A root nginx on this machine will then dispatch amongst the several apache2 virtual servers, that all run on a
different port. 