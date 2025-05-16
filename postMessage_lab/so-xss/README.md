# Exploiting window.origin in postMessage Handlers

This repository demonstrates a vulnerability in window.origin checks within postMessage event handlers, specifically targeting the technique used in the soXSS CTF challenge.
The Vulnerability
Many web applications implement postMessage security checks using window.origin instead of window.location.origin:
```js
javascriptonmessage = (e) => {
  if (e.origin !== window.origin) return;
  // This check is bypassable!
  
  // Process message...
  // Potentially dangerous operations like:
  document.body.innerHTML = e.data.html;
}
```
This creates a security vulnerability because:

Using sandbox attributes in iframes can set both e.origin and window.origin to the string 'null'
When both origins are 'null', the check passes even though they're from completely different contexts
This allows an attacker to bypass the intended same-origin protection

## Exploit Technique
The attack uses a multi-step process to bypass the origin check:

Create a sandboxed environment: The attacker creates an iframe with a strict sandbox (excluding allow-same-origin), which makes its origin 'null'
Inheritance of 'null' origin: From inside this sandbox, open a popup to the target page, which inherits the sandbox restrictions and also has a 'null' origin
Bypass the origin check: Since both e.origin and window.origin are the string 'null', the check passes
Execute malicious code: This allows sending arbitrary messages that bypass the origin check, leading to XSS
Data exfiltration: The XSS can be used to read sensitive data on the page (like CSRF tokens or user info) and exfiltrate it

### Example Attack Flow
```
Attacker Site                   Sandboxed iframe (null)            Target Site in Popup (null)
     |                                  |                                     |
     |--- Create sandboxed iframe ----->|                                     |
     |                                  |---- Open popup to target ---------->|
     |                                  |                                     |-- Page loads with 'null' origin
     |                                  |---- Send malicious postMessage ----->|
     |                                  |                                     |-- Origin checks pass
     |                                  |                                     |-- XSS executes
     |                                  |<----- Exfiltrated data -------------|
     |<-- Exfiltrated data -------------|                                     |
```
### Important Notes

The exploit payload can't access cookies or localStorage directly because the origin is 'null'
SameSite=Lax cookies are still sent with the top-level navigation request, so sensitive data may be present in the HTML
This technique was successfully used in CTF challenges, including one by terjanq

#### Mitigation
To properly secure postMessage handlers:

Use window.location.origin instead of window.origin for origin checks
Implement strict message validation beyond just origin checks
Consider using a nonce or token in messages that is set by the parent page
Be careful when rendering unsanitized content from messages, even if they pass origin checks


A vulnerable page with a window.origin check
An exploit that bypasses this check using the sandboxed iframe technique
Code to exfiltrate sensitive information from the page
