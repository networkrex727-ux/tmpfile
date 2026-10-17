import express from 'express';
import path from 'path';
import { apiApp } from './server/api.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(apiApp);

const distDir = path.resolve(process.cwd(), 'dist');
app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TmpDrop production server listening on http://0.0.0.0:${PORT}`);
});
