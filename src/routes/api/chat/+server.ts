import { OPENAI_API_KEY, OPENAI_ENDPOINT, OPENAI_MODEL } from '$env/static/private';
import { AzureKeyCredential, OpenAIClient } from '@azure/openai';
import type { RequestHandler } from './$types';
import { iterableToStream } from '$lib/utils/streamingTextResponse';

export const POST = (async ({ request }) => {
  // Extract the `prompt` from the body of the request
  const messages = await request.json();
  const client = new OpenAIClient(OPENAI_ENDPOINT, new AzureKeyCredential(OPENAI_API_KEY));
  try {
    const azureResponse = await client.listChatCompletions(
      OPENAI_MODEL,
      messages.map((message: any) => ({
        content: message.content,
        role: message.role
      }))
    );

    return new Response(iterableToStream(azureResponse), {
      headers: {
        "cache-control": "no-cache",
        "content-type": "text/event-stream",
      }
    });
  } catch (error) {
    console.error(error);
    throw error;
  }

}) satisfies RequestHandler;
