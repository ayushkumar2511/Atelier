const http = require('http'), fs = require('fs'), path = require('path');
try { fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }); } catch (e) {}
const PORT = process.env.PORT || 3000, MODEL = process.env.MODEL || 'claude-sonnet-4-6';

// ---- FEATURE CATALOGUE: edit freely ----
const CATALOGUE = [
  { id: 'form', name: 'Form', features: [
    { id: 'shape', label: 'Shape', hint: 'geometric vs organic shapes, clarity of silhouettes' },
    { id: 'line', label: 'Line quality', hint: 'contour, direction, weight, expressiveness of lines' },
    { id: 'volume', label: 'Volume & mass', hint: 'three-dimensional solidity of objects and figures' },
    { id: 'space', label: 'Positive & negative space', hint: 'balance between filled and empty areas' } ] },
  { id: 'colour', name: 'Colour', features: [
    { id: 'hue', label: 'Hue palette', hint: 'dominant colours and their range' },
    { id: 'value', label: 'Value & tonal range', hint: 'light-dark range and contrast' },
    { id: 'saturation', label: 'Saturation & intensity', hint: 'vividness vs muted tones' },
    { id: 'temperature', label: 'Colour temperature', hint: 'warm vs cool and how they interact' },
    { id: 'harmony', label: 'Colour harmony', hint: 'complementary, analogous, triadic etc.' } ] },
  { id: 'depth', name: 'Depth perception', features: [
    { id: 'overlap', label: 'Overlapping', hint: 'objects covering others to imply distance' },
    { id: 'sizegrad', label: 'Size gradient', hint: 'diminishing size with distance' },
    { id: 'perspective', label: 'Linear perspective', hint: 'converging lines, vanishing points' },
    { id: 'atmos', label: 'Atmospheric perspective', hint: 'haze, lower contrast and cooler tone in the distance' },
    { id: 'texture', label: 'Texture gradient', hint: 'detail and texture fading with distance' },
    { id: 'shading', label: 'Light & shading', hint: 'chiaroscuro, cast shadows, modelling of form' } ] },
  { id: 'design', name: 'Design basics', features: [
    { id: 'balance', label: 'Balance', hint: 'symmetrical or asymmetrical visual weight' },
    { id: 'contrast', label: 'Contrast', hint: 'tension between opposing elements' },
    { id: 'emphasis', label: 'Emphasis & focal point', hint: 'where the eye lands first' },
    { id: 'rhythm', label: 'Rhythm & repetition', hint: 'repeated elements creating beat' },
    { id: 'proportion', label: 'Proportion & scale', hint: 'size relationships between parts' },
    { id: 'movement', label: 'Movement', hint: 'how the eye is led through the work' },
    { id: 'unity', label: 'Unity', hint: 'how well all parts feel like one whole' } ] }
];
const ids = CATALOGUE.flatMap(g => g.features.map(f => f.id));
const list = CATALOGUE.map(g => g.name + ':\n' + g.features.map(f => `- ${f.id} (${f.label}): ${f.hint}`).join('\n')).join('\n');
const SYSTEM = `You are a rigorous art analyst for an auction house. Analyse the painting using ONLY this feature catalogue and score each feature 0-10 (0 = absent/poor, 5 = competent, 10 = exceptional). Be discriminating: most paintings land between 3 and 8. If a feature does not apply (e.g. linear perspective in a flat abstract), give a low score and say so.\n\n${list}\n\nReturn ONLY valid JSON, no markdown: {"title":"short descriptive title","style":"movement/style guess","medium":"medium guess","summary":"2 sentences","features":{"<id>":{"score":number,"note":"one concrete sentence about what you see"}}} with every id present: ${ids.join(', ')}.`;

async function analyse(dataUrl) {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('Invalid image');
  if (!process.env.ANTHROPIC_API_KEY || /paste-your/.test(process.env.ANTHROPIC_API_KEY)) throw new Error('ANTHROPIC_API_KEY missing - add it to the .env file and restart the server.');
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: SYSTEM, messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } }, { type: 'text', text: 'Analyse this painting with the catalogue.' }] }] }) });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'API error ' + r.status);
  const t = j.content.map(c => c.text || '').join(''); const out = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  ids.forEach(id => { const f = out.features && out.features[id]; if (!f) throw new Error('Incomplete analysis, retry'); f.score = Math.max(0, Math.min(10, Number(f.score) || 0)); });
  return out;
}
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
http.createServer(async (req, res) => {
  const send = (c, o, t = 'application/json') => { res.writeHead(c, { 'content-type': t }); res.end(typeof o === 'string' || Buffer.isBuffer(o) ? o : JSON.stringify(o)); };
  if (req.url === '/api/catalogue') return send(200, CATALOGUE);
  if (req.url === '/api/analyze' && req.method === 'POST') {
    let b = ''; req.on('data', d => { b += d; if (b.length > 30e6) req.destroy(); });
    req.on('end', async () => { try { send(200, await analyse(JSON.parse(b).image)); } catch (e) { send(500, { error: e.message }); } });
    return;
  }
  const p = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
  const f = path.join(__dirname, 'public', path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(f, (e, d) => e ? send(404, 'Not found', 'text/plain') : send(200, d, TYPES[path.extname(f)] || 'application/octet-stream'));
}).listen(PORT, () => console.log('Atelier running at http://localhost:' + PORT));
