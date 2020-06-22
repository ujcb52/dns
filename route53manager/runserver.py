#!/usr/bin/env python
from route53 import app
#app.run(host="0.0.0.0")

from OpenSSL import SSL
context = SSL.Context(SSL.SSLv23_METHOD)
context.use_privatekey_file('/app/apache/conf/sslkey/star.11stcorp.com-202011.key')
context.use_certificate_file('/app/apache/conf/sslkey/star.11stcorp.com-202011.crt')

##########################################################################################
if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        debug = True,
        ssl_context=('/app/apache/conf/sslkey/star.11stcorp.com-202011.crt', '/app/apache/conf/sslkey/star.11stcorp.com-202011.key')
    )

