import { Transform } from 'node:stream';

/**
 * @param {Array<string>} llmMessageAccumulator Array of characters that will hold the complete LLM response. Using an array so we can pass around the reference.
 * @returns {module:stream.internal.Transform}
 */
export function getTransform(llmMessageAccumulator) {
  return new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      console.log(chunk);
      const { message } = chunk;
      if (!message) {
        callback();
        return;
      }
      llmMessageAccumulator.push(...message.split(''));
      const data = toEventStreamData(message);
      callback(null, data);
    },
  });
}

function toEventStreamData(message) {
  const formattedMessage = message.replaceAll('\n', '\ndata: ');
  return `data: ${formattedMessage}\n\n`;
}
