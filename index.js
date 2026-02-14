const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para que el servidor entienda datos en formato JSON
app.use(express.json());

// Base de datos temporal (en memoria)
// En el futuro, esto será una base de datos real (SQL/NoSQL)
const urls = {}; 

// RUTA 1: Acortar la URL (POST)
app.post('/shorten', (req, res) => {
    const { longUrl } = req.body;
    
    // Generamos un ID aleatorio simple (esto es ingeniería de sistemas básica)
    const shortId = Math.random().toString(36).substring(2, 8);
    
    // Guardamos la relación en nuestro "diccionario"
    urls[shortId] = longUrl;

    res.json({
        message: "URL acortada con éxito",
        shortUrl: `http://localhost:${PORT}/${shortId}`
    });
});

// RUTA 2: Redirección (GET)
app.get('/:id', (req, res) => {
    const id = req.params.id;
    const originalUrl = urls[id];

    if (originalUrl) {
        return res.redirect(originalUrl);
    } else {
        return res.status(404).send("URL no encontrada");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});