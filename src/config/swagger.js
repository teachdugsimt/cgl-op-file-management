module.exports = {
  routePrefix: '/docs',
  swagger: {
    info: {
      title: 'Template API',
      description: 'Template API',
      version: '1.0.0'
    },
    host: 'localhost:3001',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  },
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  exposeRoute: true
}
