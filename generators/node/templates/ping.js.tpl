const express = require('express');

let app = express();

app.get('/', (req, res)=>{
    res.status(200).end('OK');
});

app.listen(<%=port%>);