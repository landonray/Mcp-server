const express = require('express');
const transport = require('./mcp/transport');

const app = express();

app.use(express.json());
app.use(transport);

// Global error handler
app.use((err, _req, res, _next) => {
  // Log error message only — never log full error objects which could contain credentials
  console.error('Unhandled error:', err.message || 'Unknown error');
  res.status(500).json({
    code: 500,
    error: 'server_error',
    message: 'An unexpected error occurred.',
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ontraport MCP Server listening on port ${PORT}`);
  });
}

module.exports = app;
