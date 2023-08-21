<script lang="ts">
  import TextArea from "$lib/components/TextArea.svelte";
  import Profile from "$lib/components/Profile.svelte";
  import SubmitButton from "$lib/components/SubmitButton.svelte";
  import Message from "$lib/components/Message.svelte";
  import { get, writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  import { v4 as uuid } from "uuid";

  let messageContainer: HTMLElement | null = null;

  type ChatMessage = {
    id?: string;
    createdAt?: Date;
    content: string;
    role: "system" | "user" | "assistant" | "function";
  }

  function scrollToBottom() {
    if (messageContainer) {
      messageContainer.scroll({
        top: messageContainer.scrollHeight,
        behavior: "smooth"
      });
    }
  }

  let initialInput = "";
  let input = writable(initialInput);
  let initialMessages: ChatMessage[] = [];
  let messages: Writable<ChatMessage[]> = writable(initialMessages);

  const triggerRequest = async () => {
    const inputValue = get(input);
    if (!inputValue) {
      return;
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(get(messages))
    });

    let responseMessage: ChatMessage = {
      id: uuid(),
      content: "",
      role: "assistant"
    }

    messages.update((messages) => {
      messages.push(responseMessage);
      return messages;
    });

    const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      responseMessage.content += value;
      messages.update((messages) => {
        messages[messages.length - 1] = responseMessage;
        return messages;
      });
    }
  };

  const append = async (message: ChatMessage) => {
    message.id = uuid();
    messages.update((messages) => {
      messages.push(message);
      return messages;
    });
    await triggerRequest();
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const inputValue = get(input);
    if (!inputValue) {
      return;
    }

    append(
      {
        content: inputValue,
        role: "user"
      }
    )
    input.set("");
  };


  $: {
    if ($messages) {
      scrollToBottom();
    }
  }
</script>

<svelte:head>
  <title>Svelte Azure Open AI</title>
</svelte:head>

<div
  class="flex-1 p-6 justify-between flex flex-col h-screen border-2 border-white bg-slate-300 rounded-2xl"
>
  <Profile />

  <div
    bind:this={messageContainer}
    class="max-h-[50vh] flex flex-col space-y-4 p-3 overflow-y-scroll scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch mt-auto"
  >
    {#each $messages as message}
      <Message {message} />
    {/each}
  </div>

  <div class="border-t-2 border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
    <div class="relative flex">
      <form class="w-full relative" on:submit={handleSubmit}>
        <TextArea {input} />
        <SubmitButton />
      </form>
    </div>
  </div>
</div>

<style lang="postcss">
  .scrollbar-w-2::-webkit-scrollbar {
    @apply w-1 h-1;
  }

  .scrollbar-track-blue-lighter::-webkit-scrollbar-track {
    @apply bg-slate-200;
  }

  .scrollbar-thumb-blue::-webkit-scrollbar-thumb {
    @apply bg-slate-400;
  }

  .scrollbar-thumb-rounded::-webkit-scrollbar-thumb {
    @apply rounded;
  }
</style>
