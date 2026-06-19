import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'registrations.json');
const CLEAR_PIN = process.env.CLEAR_PIN || '3233';

const CONFIG = {
  sessions: [
    { id: '6-7', capacity: 16 },
    { id: '7-8', capacity: 16 }
  ],
  slotChoices: ['6-7', '7-8', '6-8']
};

async function ensureDataFile(){
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeRegistrations([]);
  }
}

async function readRegistrations(){
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const data = JSON.parse(raw || '[]');
  return Array.isArray(data) ? data : [];
}

async function writeRegistrations(registrations){
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(registrations, null, 2), 'utf8');
}

function countForSession(registrations, sessionId){
  return registrations.filter(r => r.slot === sessionId || r.slot === '6-8').length;
}

function wouldExceedCapacity(registrations, slot){
  return CONFIG.sessions.some(session => {
    const appliesTo = slot === '6-8' || slot === session.id;
    return appliesTo && countForSession(registrations, session.id) >= session.capacity;
  });
}

function cleanName(name){
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
}

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/registrations', async (req, res) => {
  try {
    const registrations = await readRegistrations();
    res.json({ registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not read registrations.' });
  }
});

app.post('/api/registrations', async (req, res) => {
  try {
    const name = cleanName(req.body?.name);
    const slot = String(req.body?.slot || '').trim();

    if (!name) return res.status(400).json({ error: 'Name is required.' });
    if (!CONFIG.slotChoices.includes(slot)) return res.status(400).json({ error: 'Invalid timing.' });

    const registrations = await readRegistrations();

    if (wouldExceedCapacity(registrations, slot)) {
      return res.status(409).json({ error: 'This timing is full.' });
    }

    const added = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      slot,
      ts: Date.now()
    };

    registrations.push(added);
    registrations.sort((a, b) => a.ts - b.ts);
    await writeRegistrations(registrations);

    res.status(201).json({ added, registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save registration.' });
  }
});

app.delete('/api/registrations', async (req, res) => {
  try {
    const pin = String(req.body?.pin || '');
    if (pin !== CLEAR_PIN) {
      return res.status(403).json({ error: 'Wrong clear PIN.' });
    }
    const registrations = [];
    await writeRegistrations(registrations);
    res.json({ registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not clear registrations.' });
  }
});

app.listen(PORT, async () => {
  await ensureDataFile();
  console.log(`FBC Badminton live roster running on http://localhost:${PORT}`);
});
