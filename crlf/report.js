const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.post('/report', (req, res) => {
    console.log('Received NEL Report:');
    console.log(JSON.stringify(req.body, null, 2));
    res.status(200).send('Report received');
});

app.listen(port, () => {
    console.log(`Reporting server running on http://localhost:${port}`);
});