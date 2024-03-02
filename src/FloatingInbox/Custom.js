import { ContentTypeId } from "@xmtp/xmtp-js";

// Create a unique identifier for your content type
export const ContentTypeMultiplyNumbers = new ContentTypeId({
  authorityId: "your.domain",
  typeId: "multiply-number",
  versionMajor: 1,
  versionMinor: 0,
});

// Define the MultiplyNumbers class
export class MultiplyNumbers {
  constructor(num1, num2, result) {
    this.num1 = num1;
    this.num2 = num2;
    this.result = result;
  }
}

// Define the MultiplyCodec class
export class ContentTypeMultiplyNumberCodec {
  get contentType() {
    return ContentTypeMultiplyNumbers;
  }

  // The encode method accepts an object of MultiplyNumbers and encodes it as a byte array
  encode(numbers) {
    const { num1, num2 } = numbers;
    return {
      type: ContentTypeMultiplyNumbers,
      parameters: {},
      content: new TextEncoder().encode(JSON.stringify({ num1, num2 })),
    };
  }

  // The decode method decodes the byte array, parses the string into numbers (num1, num2), and returns their product
  decode(encodedContent) {
    const decodedContent = new TextDecoder().decode(encodedContent.content);
    const { num1, num2 } = JSON.parse(decodedContent);
    return new MultiplyNumbers(num1, num2, num1 * num2);
  }

  fallback(content) {
    return `Can’t display number content types. Number was ${JSON.stringify(
      content,
    )}`;
    // return undefined to indicate that this content type should not be displayed if it's not supported by a client
  }
}
