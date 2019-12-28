from http.server import BaseHTTPRequestHandler,HTTPServer

PORT_NUMBER = 1004

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == "":
            self.path = "/static/snowflake_editor.html"
        try:
            sendReply = False
            if (self.path.startswith("/static") or
                self.path.endswith(".html")  or 
                self.path.endswith(".js")):

                sendReply = True

            mimetypes = {
                "html" : "text/html",
                "js"   : "application/javascript",
            }
            mimetype = mimetypes.get(self.path.split('.')[-1])

            if sendReply:
                f = open("." + self.path, "rb")
                self.send_response(200)
                self.send_header("Content-type", mimetype)
                self.end_headers()
                self.wfile.write(f.read())
                f.close()
            return
        except IOError:
            self.send_error(404, "File Not Found: " + self.path)
            
try:
    server = HTTPServer(("", PORT_NUMBER), Handler)
    server.serve_forever()
except KeyboardInterrupt:
    server.socket.close()