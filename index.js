const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static('public'));

let db;

// Conexión a la base de datos (se crea un archivo llamado database.db)
(async () => {
    db = await open({
        filename: './database.db',
        driver: sqlite3.Database
    });
    // Crear la tabla si no existe
    await db.exec(`
        CREATE TABLE IF NOT EXISTS enlaces (
            id TEXT PRIMARY KEY,
            url_original TEXT,
            clics INTEGER DEFAULT 0
        )
    `);
})();

// RUTA 1: Guardar en la base de datos (POST)
app.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;
    const shortId = Math.random().toString(36).substring(2, 8);

    await db.run(
        'INSERT INTO enlaces (id, url_original) VALUES (?, ?)',
        [shortId, longUrl]
    );

    // --- REEMPLAZO DESDE AQUÍ ---
    const host = req.get('host'); 
    const protocol = req.protocol; 

    res.json({ shortUrl: `${protocol}://${host}/${shortId}` });
    // --- HASTA AQUÍ ---
});

// RUTA 2: Redirección y contador de clics (GET)
app.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    // Buscamos en la DB
    const enlace = await db.get('SELECT * FROM enlaces WHERE id = ?', [id]);

    if (enlace) {
        // ACTUALIZACIÓN: Sumamos un clic (Ingeniería de datos básica)
        await db.run('UPDATE enlaces SET clics = clics + 1 WHERE id = ?', [id]);
        return res.redirect(enlace.url_original);
    }
    res.status(404).send("URL no encontrada");
});

// RUTA 3: Ver estadísticas de un enlace (GET)
app.get('/stats/:id', async (req, res) => {
    const { id } = req.params; // Extraemos el ID de la URL

    try {
        // Buscamos el registro en la base de datos
        const enlace = await db.get('SELECT * FROM enlaces WHERE id = ?', [id]);

        if (enlace) {
            // Si existe, respondemos con un objeto JSON profesional
            res.json({
                id: enlace.id,
                url_original: enlace.url_original,
                clics_totales: enlace.clics,
                mensaje: "Estadísticas recuperadas con éxito"
            });
        } else {
            // Si el ID no existe en la DB
            res.status(404).json({ error: "Ese código de enlace no existe." });
        }
    } catch (error) {
        // Manejo de errores (fundamental en ingeniería)
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
// RUTA 4: Obtener todos los enlaces para la tabla de estadísticas
app.get('/api/all-stats', async (req, res) => {
    try {
        const enlaces = await db.all('SELECT * FROM enlaces ORDER BY clics DESC');
        res.json(enlaces);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
});
app.listen(3000, () => console.log("🚀 Motor con persistencia listo en el puerto 3000"));