import 'dotenv/config';

import app from './presentation/app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[API] Health check: http://localhost:${PORT}/api/health`);
});
