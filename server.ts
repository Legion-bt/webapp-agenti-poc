import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the built client dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Basic health check for Cloud Run / monitoring
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// SPA routing fallback: send index.html for all other routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`AgenteGo production server listening on 0.0.0.0:${PORT}`);
});
