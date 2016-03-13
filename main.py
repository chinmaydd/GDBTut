# Bottle API server
import bottle
from bottle import route, run, template, request, response, static_file, error

# For executing system commands
import subprocess

# For debugging purposes
import pdb

# For storing of data?
import pickledb
db = pickledb.load('storage.db', 'False')

p1 = None

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
    global p1
    p1 = subprocess.Popen(['gdb', 'test/a.out'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

@app.error(404)
def error404(error):
    return "Nothing here, Sorry"

def execute_in_gdb():
    pdb.set_trace()
    return "Something, new"

@app.route("/api/v1/execute", method=["POST", "OPTIONS"])
@enable_cors
def execute():
    req = request.json
    new_cmd = req['command']

    response.content_type = "application/json"
    response_variable = {}

    result = execute_in_gdb()
    response_variable['result'] = result

    return response_variable

@app.route("/static/<filename>", method="GET")
@enable_cors
def index(filename):
    initialize()
    return static_file(filename, root='./')

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--host", dest="host", default="localhost",
                      help="hostname or ip address", metavar="host")
    parser.add_option("--port", dest="port", default=8080,
                      help="port number", metavar="port")
    (options, args) = parser.parse_args()
    run(app, host=options.host, port=int(options.port))
