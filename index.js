const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Node app running on Render from Android!', status: 'success' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

