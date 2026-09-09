import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';

import { webAgent } from './agents/web-agent';
import { researchBriefWorkflow } from './workflows/research-brief';

export const mastra = new Mastra({
  agents: { webAgent },
  workflows: { researchBriefWorkflow },
  // A local file is enough to run the template. Point this at Turso or another
  // libSQL database when you deploy.
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: 'file:../mastra.db',
  }),
  logger: new PinoLogger({ name: 'Mastra', level: 'info' }),
});
