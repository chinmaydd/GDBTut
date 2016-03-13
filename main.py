# Bottle API server
from bottle import route, run, template, request, response, static_file

# For debugging purposes
import pdb

# For storing of data?
import pickledb
db = pickledb.load('storage.db', 'False')

@route("/static/<filename>", method="GET")
def index(filename):
    return static_file(filename, root='./')

run(host='localhost', port=8080)
