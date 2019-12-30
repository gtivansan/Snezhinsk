from app import app, db
from flask import render_template, request

@app.route('/')
@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/editor")
def snowflake_editor():
    return render_template("snowflake_editor.html")

@app.route("/send_flake", methods=["POST"])
def send_flake():
    signature = request.form.get("signature")
    snowflake = request.form.get("snowflake")
    db.addSnowflake(signature, snowflake)
    return ""