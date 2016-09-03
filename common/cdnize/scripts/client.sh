#! /bin/bash

echo "
http_proxy = http://95.111.13.111:3128/
use_proxy = on
wait = 15
" > ~/.wgetrc

cd $3
find $1/clients/standalone -type f  -print | sed -e 's/^/https:\/\/$2\//' | bash $1/common/cdnize/scipts/client_get.sh
diff -r $1/clients/standalone .