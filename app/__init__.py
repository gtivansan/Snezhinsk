from flask import Flask
from database import Database

app = Flask(__name__)
db = Database()

from app import routes