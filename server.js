const express = require('express');
const bodyParser = require('body-parser');
const sqLite3 = require ('sqlite3').verbose();
const app = express();
const PORT = 3000;

app.use(express.static('public'));   //Servir archivos estáticos
app.use(bodyParser.json());

//Inicar la bd en SQLite
const db = new sqLite3.Database('./myFormData.db', (err) => {
    if(err){
        console.error(err.message);
    }
    console.log('Connected to my SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS submissions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL
    )`);
});


app.post('/submit', (req, res) => {
    const {name, email} = req.body;
    const sql = `INSERT INTO submissions (name, email) VALUES (?,?)`;

    db.run(sql, [name, email], (err) => {
        if(err){
            return console.error(err.message);
        }
        res.send({message: `Data saved successfully`});
    });
});

app.listen(PORT, () => {
    console.log( `Server running on http://localhost:${PORT}`);
})