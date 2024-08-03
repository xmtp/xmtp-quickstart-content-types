import React, { useState, useRef, useEffect } from "react";
import {
  ContentTypeRemoteAttachment,
  ContentTypeAttachment,
  RemoteAttachmentCodec,
  AttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { MessageInput } from "./MessageInput";
import MessageItem from "./MessageItem";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeMultiplyNumbers } from "./Custom";
import { create } from "@web3-storage/w3up-client";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";

export const MessageContainer = ({
  conversation,
  client,
  searchTerm,
  selectConversation,
}) => {
  const [imageSources, setImageSources] = useState({});
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const isFirstLoad = useRef(true);
  const [messages, setMessages] = useState([]);
  const [loadingText, setLoadingText] = useState("");
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);
  const styles = {
    loadingText: {
      textAlign: "center",
    },
    messagesContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
    },
    messagesList: {
      paddingLeft: "5px",
      paddingRight: "5px",
      margin: "0px",
      alignItems: "flex-start",
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    },
  };

  const handleReply = async (originalMessage) => {
    setReplyingToMessage(originalMessage);
  };

  const handleReaction = async (message, emoji) => {
    const existingReaction = Array.from(message.reactions || []).find(
      (r) => r === emoji,
    );
    const action = existingReaction ? "removed" : "added";

    const reaction = {
      reference: message.id,
      schema: "unicode",
      action: action,
      content: emoji,
    };

    await conversation.send(reaction, {
      contentType: ContentTypeReaction,
    });
  };

  const updateMessages = (prevMessages, newMessage) => {
    if (newMessage.contentType.sameAs(ContentTypeReaction)) {
      const originalMessageId = newMessage.content.reference;
      return prevMessages.map((m) => {
        if (m.id === originalMessageId) {
          if (!m.reactions) {
            m.reactions = new Set();
          }
          if (newMessage.content.action === "added") {
            m.reactions.add(newMessage.content.content);
          } else if (newMessage.content.action === "removed") {
            m.reactions.delete(newMessage.content.content);
          }
          m.reactions = new Set(m.reactions);
        }
        return m;
      });
    }

    if (newMessage.contentType.sameAs(ContentTypeReadReceipt)) {
      const readReceiptTimestamp = new Date(newMessage.sent).getTime();
      return prevMessages.map((m) => {
        const messageTimestamp = new Date(m.sent).getTime();
        if (messageTimestamp <= readReceiptTimestamp) {
          m.isRead = true;
        }
        return m;
      });
    }

    const doesMessageExist = prevMessages.some(
      (existingMessage) => existingMessage.id === newMessage.id,
    );

    if (!doesMessageExist) {
      return [...prevMessages, newMessage];
    }

    return prevMessages;
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (conversation && conversation.peerAddress && isFirstLoad.current) {
        setIsLoading(true);
        const initialMessages = await conversation?.messages();

        let updatedMessages = [];
        initialMessages.forEach((message) => {
          updatedMessages = updateMessages(updatedMessages, message);
        });

        setMessages(updatedMessages);
        setIsLoading(false);
        isFirstLoad.current = false;
      }
    };

    fetchMessages();
  }, [conversation]);

  const startMessageStream = async () => {
    let stream = await conversation.streamMessages();
    for await (const message of stream) {
      setMessages((prevMessages) => {
        return updateMessages(prevMessages, message);
      });
    }
  };

  useEffect(() => {
    if (conversation && conversation.peerAddress) {
      startMessageStream();
    }
    return () => {
      // Cleanup code if needed
    };
  }, [conversation]);

  const [lastReadMessageId, setLastReadMessageId] = useState(null);

  useEffect(() => {
    const sendReadReceipts = async () => {
      const unreadMessages = messages.filter((message) => !message.isRead);
      if (unreadMessages.length > 0) {
        const lastUnreadMessage = unreadMessages[unreadMessages.length - 1];

        if (lastUnreadMessage.id !== lastReadMessageId) {
          try {
            await conversation.send(
              {},
              {
                contentType: ContentTypeReadReceipt,
              },
            );
            setLastReadMessageId(lastUnreadMessage.id);
          } catch (error) {
            console.error("Failed to send read receipt:", error);
          }
        }
      }
    };

    sendReadReceipts();
  }, [messages, conversation, lastReadMessageId]);

  const handleSendMessage = async (
    newMessage,
    image,
    replyingToMessage = null,
  ) => {
    if (!newMessage.trim() && !image) {
      alert("empty message");
      return;
    }
    console.log(image);
    if (image) {
      //await handleLargeFile(image);
      await handleSmallFile(image);
    } else {
      if (conversation && conversation.peerAddress) {
        if (replyingToMessage && replyingToMessage.id) {
          try {
            const reply = {
              action: "added",
              content: "smile",
              contentType: ContentTypeMultiplyNumbers,
              reference: replyingToMessage.id,
            };
            await conversation.send(reply, {
              contentType: ContentTypeReply,
            });
            setReplyingToMessage(null);
          } catch (error) {
            console.error(error);
          }
        } else await conversation.send(newMessage);
      } else if (conversation) {
        const conv = await client.conversations.newConversation(searchTerm);
        selectConversation(conv);
        await conv.send(newMessage);
      }
    }

    setImage(null);
  };
  // Function to handle sending a small file attachment
  const handleSmallFile = async (file) => {
    // Convert the file to a Uint8Array
    const blob = new Blob([file], { type: file.type });
    let imgArray = new Uint8Array(await blob.arrayBuffer());

    const attachment = {
      filename: file?.name ?? "audio",
      mimeType: file.type,
      data: imgArray,
    };
    console.log(attachment);
    await conversation.send(attachment, { contentType: ContentTypeAttachment });
  };

  async function uploadtow3(upload) {
    const client = await create();
    const myAccount = await client.login("fguespe@gmail.com");
    const space = await client.createSpace("my-awesome-space");
    await myAccount.provision(space.did());
    await space.save();
    await client.setCurrentSpace(space.did());
    const cid = await client.uploadFile(upload);
    return cid;
  }
  const handleLargeFile = async (file) => {
    setIsLoadingUpload(true);
    setLoadingText("Uploading...");

    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error("Not an ArrayBuffer"));
          }
        };
        reader.readAsArrayBuffer(file);
      });

      const attachment = {
        filename: file?.name ?? "audio",
        mimeType: file?.type,
        data: new Uint8Array(data),
      };

      const encryptedEncoded = await RemoteAttachmentCodec.encodeEncrypted(
        attachment,
        new AttachmentCodec(),
      );

      class Upload {
        constructor(name, data) {
          this.name = name;
          this.data = data;
        }

        stream() {
          const self = this;
          return new ReadableStream({
            start(controller) {
              controller.enqueue(Buffer.from(self.data));
              controller.close();
            },
          });
        }
      }
      const upload = new Upload(attachment.filename, encryptedEncoded.payload);

      const cid = await uploadtow3(upload);

      const url = `https://${cid}.ipfs.w3s.link/`;
      setLoadingText(url);
      const remoteAttachment = {
        url: url,
        contentDigest: encryptedEncoded.digest,
        salt: encryptedEncoded.salt,
        nonce: encryptedEncoded.nonce,
        secret: encryptedEncoded.secret,
        scheme: "https://",
        filename: attachment.filename,
        contentLength: attachment.data.byteLength,
      };

      setLoadingText("Sending...");
      await conversation.send(remoteAttachment, {
        contentType: ContentTypeRemoteAttachment,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingUpload(false);
    }
  };
  const handleFileUpload = (event) => {
    const file = event?.target?.files[0];
    setImage(file);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getImageSrcFromMessage = async (message, client) => {
    try {
      const attachment = await RemoteAttachmentCodec.load(
        message.content,
        client,
      );
      if (attachment && attachment.data) {
        const objectURL = URL.createObjectURL(
          new Blob([Buffer.from(attachment.data)], {
            type: attachment.mimeType,
          }),
        );
        return objectURL;
      }
    } catch (error) {
      console.error("Failed to load and render attachment:", error);
    }
    return null;
  };

  useEffect(() => {
    const fetchImageSources = async () => {
      let newImageSources = {};

      for (const message of messages) {
        if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
          newImageSources[message.id] = await getImageSrcFromMessage(
            message,
            client,
          );
          console.log(newImageSources[message.id]);
        } else if (message.contentType.sameAs(ContentTypeAttachment)) {
          console.log(message.content);
          newImageSources[message.id] = URL.createObjectURL(
            new Blob([Buffer.from(message.content.data)], {
              type: message.content.mimeType,
            }),
          );
          console.log(newImageSources[message.id]);
        }
      }

      setImageSources(newImageSources);
    };

    fetchImageSources();
  }, [messages, client]);

  return (
    <div style={styles.messagesContainer}>
      {isLoading ? (
        <small style={styles.loadingText}>Loading messages...</small>
      ) : (
        <>
          <ul style={styles.messagesList}>
            {messages.slice().map((message) => {
              let originalMessage = messages.find(
                (m) => m.id === message.content.reference,
              );

              return (
                <MessageItem
                  key={
                    message.id +
                    "-" +
                    Array.from(message.reactions ?? []).length
                  }
                  message={message}
                  originalMessage={originalMessage}
                  imgSrc={imageSources[message.id]}
                  senderAddress={message.senderAddress}
                  client={client}
                  onReply={handleReply}
                  onReaction={handleReaction}
                  messageReactions={Array.from(message.reactions ?? [])}
                  isRead={message.isRead || false}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </ul>
          <MessageInput
            isLoadingUpload={isLoadingUpload}
            loadingText={loadingText}
            replyingToMessage={replyingToMessage}
            onSendMessage={(msg, img) => {
              handleSendMessage(msg, img, replyingToMessage);
              setReplyingToMessage(null);
            }}
            onFileUpload={handleFileUpload}
          />
        </>
      )}
    </div>
  );
};
