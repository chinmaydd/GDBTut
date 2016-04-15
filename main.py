# Bottle API server
import bottle
from bottle import route, run, template, request, response, static_file, error

# For executing system commands
import subprocess, fcntl, os

import time

# For debugging purposes
import pdb

p = None

app = bottle.Bottle()

# the decorator
def enable_cors(fn):
    def _enable_cors(*args, **kwargs):
        # set CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'

        if bottle.request.method != 'OPTIONS':
            # actual request; reply with the actual response
            return fn(*args, **kwargs)

    return _enable_cors

def initialize():
    global p
    p = subprocess.Popen(['gdb', '-silent', 'test/a.out'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    fcntl.fcntl(p.stdout.fileno(), fcntl.F_SETFL, os.O_NONBLOCK)

    subprocess.Popen(['play', '-q', 'test.mp3'])

@app.error(404)
def error404(error):
    return "Nothing here, Sorry"

def execute_in_gdb(cmd):
    if cmd == "quit":
        p.kill()
        return "Thank you for using GDB."
#     pdb.set_trace()
    p.stdin.write(cmd + '\n')
    time.sleep(2)
    try:
        # pdb.set_trace()
        output = p.stdout.read()
        output = output.split("\n")[:-1]
        output = "\n".join(output)
    except IOError:
        output = "An error occurred. Please try again."

    return output

@app.route("/api/v1/execute", method=["POST", "OPTIONS"])
@enable_cors
def execute():
    req = request.json
    cmd = req['command']

    response.content_type = "application/json"
    response_variable = {}

    result = execute_in_gdb(cmd)
    response_variable['result'] = result

    return response_variable

# Static Routes
@app.get('/<filename:re:.*\.js>')
def javascripts(filename):
    return static_file(filename, root='static/js')

@app.get('/<filename:re:.*\.css>')
def stylesheets(filename):
    return static_file(filename, root='static/css')

@app.get('/<filename:re:.*\.(jpg|png|gif|ico)>')
def images(filename):
    return static_file(filename, root='static/img')

@app.get('/<filename:re:.*\.(eot|ttf|woff|svg)>')
def fonts(filename):
    return static_file(filename, root='static/fonts')

@app.route("/", method="GET")
@enable_cors
def home():
    initialize()
    return static_file('index.html', root='')

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--host", dest="host", default="localhost",
                      help="hostname or ip address", metavar="host")
    parser.add_option("--port", dest="port", default=8080,
                      help="port number", metavar="port")
    (options, args) = parser.parse_args()
    run(app, host=options.host, port=int(options.port))
