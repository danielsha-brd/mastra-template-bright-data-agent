import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * A two-step workflow: gather live sources, then turn them into a structured
 * brief. The agent does the tool calling; the workflow decides the shape of
 * the result, which is what you want when something downstream consumes it.
 */
const briefSchema = z.object({
  topic: z.string(),
  summary: z.string().describe('Two or three sentences answering the question directly.'),
  keyPoints: z.array(z.string()).describe('Three to six specific findings, each backed by a source.'),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
      }),
    )
    .describe('Every page that was actually read.'),
});

const gatherStep = createStep({
  id: 'gather-sources',
  description: 'Search the live web and read the most relevant pages.',
  inputSchema: z.object({
    topic: z.string().describe('The question or topic to research.'),
  }),
  outputSchema: z.object({
    topic: z.string(),
    findings: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('webAgent');

    const result = await agent.generate(
      `Research this topic: ${inputData.topic}

Search first, then read the three to five most relevant pages in full. Report what each page said and include its URL.`,
    );

    return { topic: inputData.topic, findings: result.text };
  },
});

const writeBriefStep = createStep({
  id: 'write-brief',
  description: 'Turn the raw findings into a structured brief.',
  inputSchema: z.object({
    topic: z.string(),
    findings: z.string(),
  }),
  outputSchema: briefSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('webAgent');

    const result = await agent.generate(
      `Turn these findings into a brief on "${inputData.topic}". Use only what the sources below support.

${inputData.findings}`,
      { structuredOutput: { schema: briefSchema } },
    );

    return result.object as z.infer<typeof briefSchema>;
  },
});

export const researchBriefWorkflow = createWorkflow({
  id: 'research-brief',
  description: 'Research a topic on the live web and return a structured brief with sources.',
  inputSchema: z.object({
    topic: z.string().describe('The question or topic to research.'),
  }),
  outputSchema: briefSchema,
})
  .then(gatherStep)
  .then(writeBriefStep)
  .commit();
