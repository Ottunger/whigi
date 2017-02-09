#! /bin/bash

echo "
open $3
user anonymous info@wissl.org
binary

lcd $1
cd whigi
get data.js
get index.js
get user.js
cd ../utils
get BloomFilter.js
get RSAPool.js
get checks.js
get utils.js
cd ../common/cdnize
get Downloader.js
get full-update_pb.js
get Integrity.js
get Uploader.js
get Downloader.js
cd ../models
get Datafragment.js
get IModel.js
get Oauth.js
get Token.js
get User.js
get Vault.js
cd ../
get Datasource.js

bye
" | ftp -n -

diff $1/data.js $2/whigi/data.js 1>&2
diff $1/index.js $2/whigi/index.js 1>&2
diff $1/user.js $2/whigi/user.js 1>&2
diff $1/BloomFilter.js $2/utils/Bloomfilter.js 1>&2
diff $1/RSAPool.js $2/utils/RSAPool.js 1>&2
diff $1/checks.js $2/utils/checks.js 1>&2
diff $1/utils.js $2/utils.utils.js 1>&2
diff $1/Downloader.js $2/common/cdnize/Downloader.js 1>&2
diff $1/full-update_pb.js $2/common/cdnize/full-update_pb.js 1>&2
diff $1/Integrity.js $2/common/cdnize/Integrity.js 1>&2
diff $1/Uploader.js $2/common/cdnize/Uploader.js 1>&2
diff $1/Downloader.js $2/common/cdnize/Downloader.js 1>&2
diff $1/Datafragment.js $2/common/models/Datafragment.js 1>&2
diff $1/IModel.js $2/common/models/IModel.js 1>&2
diff $1/Oauth.js $2/common/models/Oauth.js 1>&2
diff $1/Token.js $2/common/models/Token.js 1>&2
diff $1/User.js $2/common/models/User.js 1>&2
diff $1/Vault.js $2/common/models/Vault.js 1>&2
diff $1/Datasource.js $2/common/Datasource.js 1>&2