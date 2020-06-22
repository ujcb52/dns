from flask import Flask, request, render_template, session, redirect, url_for
from conf import db_conn
from werkzeug.exceptions import HTTPException
import Named, Format, Crowd, Cdn
import json
import time

app = Flask(__name__)
app.secret_key = '2\r+L|PQ"uNtFQ:W3Z^8'

SESSION_TIMEOUT = 1800
LOGIN_FAIL_HISTORY = {}

def check_session(func):
    def wrapper():
	if not 'uid' in session:
	    return redirect(url_for('login'))
	elif time.time() - session.get('expire', 0) > 0:
	    return redirect(url_for('login'))
	else:
	    session['expire'] = time.time() + SESSION_TIMEOUT
	    return func()
    return wrapper

def get_allowUsers():
    sql = 'SELECT id FROM users WHERE dns_admin = 1'
    result = db_conn.infrase_db_query(sql)
    allowUsers = [ x[0] for x in result ]
    return allowUsers

def check_login_fail_count(userid, deltatime, maxcount):
    from_time = time.time() - deltatime
    if userid not in LOGIN_FAIL_HISTORY:
	return True
    count = 0
    for fail in LOGIN_FAIL_HISTORY[userid]:
	if fail > from_time:
	    count += 1
    if count >= maxcount:
	return False
    return True

def handle_error(e):
    code = 500
    if isinstance(e, HTTPException):
        code = e.code    
    return render_template('error.html'), code

for cls in HTTPException.__subclasses__():
    app.register_error_handler(cls, handle_error)

@app.route('/', methods=['GET'], endpoint='index')
##@check_session
def index():
    return render_template('index.html')

@app.route('/api', methods=['POST'], endpoint='api')
##@check_session
def api():
    data = request.json
    N = Named.Named()
    ret = N.run(data)
    ret = json.dumps(ret)
    return ret

@app.route('/format', methods=['GET'], endpoint='format')
#@check_session
def format():
    return render_template('format.html')

@app.route('/formatApi', methods=['POST'], endpoint='formatApi')
#@check_session
def formatApi():
    data = request.json
    F = Format.Format()
    ret = F.run(data)
    ret = json.dumps(ret)
    return ret

@app.route('/oaformat', methods=['GET'], endpoint='oaformat')
#@check_session
def oaformat():
    return render_template('oaformat.html')

@app.route('/oaformatApi', methods=['POST'], endpoint='oaformatApi')
#@check_session
def oaformatApi():
    data = request.json
    F = Format.Format()
    ret = F.run(data)
    ret = json.dumps(ret)
    return ret

# add by paul for swapfile
@app.route('/swap', methods=['GET'], endpoint='swap')
#@check_session
def swap():
    return render_template('swap.html')

@app.route('/swapApi', methods=['POST'], endpoint='swapApi')
#@check_session
def swapApi():
    data = request.json
    N = Named.Named()
    ret = N.run(data)
    ret = json.dumps(ret)
    return ret

@app.route('/cdn', methods=['GET'], endpoint='cdn')
#@check_session
def cdn():
    return render_template('cdn.html')

@app.route('/cdnApi', methods=['POST'], endpoint='cdnApi')
#@check_session
def cdnApi():
    data = request.json
    C = Cdn.Cdn()
    ret = C.Run(data)
    ret = json.dumps(ret)
    return ret

@app.route('/login', methods=['GET', 'POST'])
def login():
    global LOGIN_FAIL_HISTORY
    if request.form:
        id = request.form['id']
        password = request.form['password']
        crowd = Crowd.Crowd()
	if not check_login_fail_count(id, 1800, 5):
	    return 'Login fail count limit exceeded!'
        elif crowd.login(id, password):
            userInfo = crowd.getUserInfo(id)
            uid = userInfo['name'].lower()
            name = userInfo['last-name'] + userInfo['first-name']
	    allowUsers = get_allowUsers()
            if uid in allowUsers:
                session['uid'] = uid
                session['name'] = name
		session['expire'] = time.time() + SESSION_TIMEOUT
		LOGIN_FAIL_HISTORY[id] = []
                return redirect(url_for('index'))
            return 'You do not have enough access privileges for this page!'
	else:
	    if id in LOGIN_FAIL_HISTORY:
		LOGIN_FAIL_HISTORY[id].append(time.time())
	    else:
		LOGIN_FAIL_HISTORY[id] = [time.time()]
    return render_template('login.html')

@app.route('/logout', methods=['GET'])
def logout():
    if 'uid' in session:
        del session['uid']
    if 'expire' in session:
	del session['expire']
    return redirect(url_for('login'))

@app.after_request
def add_header(r):
    r.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    r.headers['Pragma'] = 'no-cache, no-store'
    r.headers['Expires'] = '0'
    return r
