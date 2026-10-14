# Echo

A responsive, local-only React chatbot with scripted replies. No backend or AI API is required.

## Run

```sh
npm install
npm run dev
```

## Customize the replies

Edit the `responses` array in `src/responses.js`:

```js
export const responses = ["answer 1", "answer 2", "answer 3"];
```

Every submitted message consumes the next response, regardless of the user's input. New chats restart at the first response. Once the array is exhausted, the chatbot shows `endOfScript`, which is also editable. Stopping a response still consumes it.

Replies appear progressively at 95 characters per second after a short pause. Change the default `charactersPerSecond` in `getVisibleText` to adjust the speed. Newlines in responses are preserved; responses are rendered as plain text, not HTML or Markdown.

Enter sends a message; Shift+Enter adds a new line. You can stop a reply, copy it, search previous chats, and delete conversations. Chat history is saved in this browser's local storage. Do not use sensitive information on shared devices. Fonts load from Google Fonts; messages are not sent to a server. Reloading during a reply may discard that unfinished response.

## Checks

```sh
npm test
npm run build
```