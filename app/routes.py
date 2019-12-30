from app import app, db
from flask import render_template, request, make_response
import json

@app.route('/')
@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/editor")
def snowflakeEditor():
    return render_template("snowflake_editor.html")

@app.route("/sendSnowflake", methods=["POST"])
def sendSnowflake():
    print("added snowflake")
    signature = request.form.get("signature")
    snowflake = request.form.get("snowflake")
    db.addSnowflake(signature, snowflake)
    return make_response("ok", 200)

@app.route("/getSnowflakesCount")
def getSnowflakesCount():
    return str(db.getSnowflakesCount())

@app.route("/getSnowflake")
def getSnoeflake():
    id = request.args.get("id")
    snowflake = db.getSnowflake(id)
    return json.dumps(snowflake.toDict())
