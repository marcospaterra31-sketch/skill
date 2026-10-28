import serverless from 'serverless-http';
import { app } from '../../server.ts';

// Netlify Serverless Function Handler
// Permite que todo o backend Express (APIs de Skills, IA, Testes, Auditoria, Exportação)
// seja executado na infraestrutura Serverless da Netlify com escalabilidade automática.
const serverlessHandler = serverless(app, {
  request: (req: any, _event: any, _context: any) => {
    // Garante que o basePath '/.netlify/functions/api' seja normalizado para a rota do Express
    if (req.url && req.url.startsWith('/.netlify/functions/api')) {
      req.url = req.url.replace('/.netlify/functions/api', '') || '/';
    }
  },
});

export const handler = async (event: any, context: any) => {
  // Configuração de contexto para manter conexões com Cloud SQL abertas entre invocações
  context.callbackWaitsForEmptyEventLoop = false;
  return serverlessHandler(event, context);
};
