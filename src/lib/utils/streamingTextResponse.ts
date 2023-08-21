import type { ChatCompletions } from "@azure/openai";

export function iterableToStream(iterable: AsyncIterable<Omit<ChatCompletions, "usage">>) {
  const iterator = iterable[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        for (const choice of value.choices) {
          controller.enqueue(choice.delta?.content ?? "");
        }
      }
    },
  });
}
