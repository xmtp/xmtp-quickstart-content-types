import React, { useState, useRef, useEffect } from "react";
import { ContentTypeRemoteAttachment } from "@xmtp/content-type-remote-attachment";
import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { ContentTypeReply } from "@xmtp/content-type-reply";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
const emojis = ["❤️", "😍", "💪🏻", "🫡"];

const styles = {
  StyledBadge: {
    padding: "0.225rem",
    backgroundColor: "lightgrey",
    fontSize: "12px",
    borderRadius: "5px",
    display: "inline-block",
    margin: "auto",
    marginRight: "10px",
  },
  RenderedMessage: {
    fontSize: "12px",
    padding: "0px",
  },
  EmojiPickerContainer: {
    display: "block",
    backgroundColor: "#f0f0f0",
    padding: "5px",
    borderRadius: "10px",
  },
  ReplyButton: {
    cursor: "pointer",
    display: "block",
    textDecoration: "underline",
  },
  EmojiItem: {
    cursor: "pointer",
    fontSize: "12px",
  },
  OriginalMessage: {
    fontSize: "10px",
    color: "grey",
  },
  MessageContent: {
    backgroundColor: "lightblue",
    padding: "5px 10px",
    textAlign: "left",
    display: "inline-block",
    margin: "5px",
    borderRadius: "5px",
    maxWidth: "80%",
    cursor: "pointer",
    listStyle: "none",
  },
  ReactionAndReplyDiv: {
    listStyle: "none",
    textAlign: "left",
    fontSize: "10px",
  },
  SenderMessage: {
    textAlign: "left",
    listStyle: "none",
    width: "100%",
  },
  ReceiverMessage: {
    textAlign: "right",
    listStyle: "none",
    width: "100%",
  },
  Footer: {
    display: "block",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  TimeStamp: {
    fontSize: "8px",
    color: "grey",
    display: "block",
    width: "100%",
  },
  UnreadCheckmark: {
    color: "grey",
    display: "block",
    fontSize: "8px",
    width: "100%",
  },
  ReadCheckmark: {
    color: "blue",
    display: "block",
    fontSize: "8px",
    width: "100%",
  },
};

const EmojiPicker = ({ onSelect }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onSelect(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onSelect]);

  return (
    <div style={styles.EmojiPickerContainer} ref={pickerRef}>
      <a style={styles.ReplyButton} onClick={() => onSelect("reply")}>
        Reply
      </a>
      {emojis.map((emoji, index) => (
        <span
          style={styles.EmojiItem}
          key={index}
          onClick={() => onSelect(emoji)}
          role="img"
          aria-label={`emoji-${index}`}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
};

const MessageItem = ({
  message,
  senderAddress,
  client,
  imgSrc,
  originalMessage,
  onReaction,
  onReply,
  messageReactions,
  isRead,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState(messageReactions || []);

  const handleReplyPick = (reply) => {
    if (reply) {
      onReply(message, reply);
    }
    setShowEmojiPicker(false);
  };

  const handleEmojiPick = (emoji) => {
    if (emoji) {
      setReactions((prevReactions) => {
        if (prevReactions.includes(emoji)) {
          return prevReactions.filter((r) => r !== emoji);
        }
        return [...prevReactions, emoji];
      });

      onReaction(message, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleSelect = (selected) => {
    if (selected === "reply") {
      handleReplyPick(selected);
    } else {
      handleEmojiPick(selected);
    }
  };

  const handleLeftClick = (event) => {
    event.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  };

  const renderMessage = (message) => {
    try {
      if (message.contentType.sameAs(ContentTypeRemoteAttachment)) {
        return (
          <>
            {imgSrc ? (
              <img src={imgSrc} alt="Attachment" style={{ maxWidth: "100%" }} />
            ) : (
              "Downloading attachment..."
            )}
          </>
        );
      } else if (message.contentType.sameAs(ContentTypeReaction)) {
        //No render reactions
      } else if (message.contentType.sameAs(ContentTypeReply)) {
        console.log("message.content.content", message.content.content);
        return <>{message?.content?.content}</>;
      } else if (message.contentType.sameAs(ContentTypeReadReceipt)) {
        //No render reactions
      } else if (message?.content.length > 0) {
        return <div style={styles.RenderedMessage}>{message?.content}</div>;
      }
    } catch {
      return message?.fallbackContent ? (
        message?.fallbackContent
      ) : message?.contentFallback ? (
        message?.contentFallback
      ) : (
        <div style={styles.RenderedMessage}>{message?.content}</div>
      );
    }
  };

  const isSender = senderAddress === client?.address;

  return (
    <li
      style={isSender ? styles.SenderMessage : styles.ReceiverMessage}
      key={message.id}
      onClick={handleLeftClick}
    >
      <div style={styles.MessageContent}>
        {originalMessage && (
          <div style={styles.OriginalMessage}>{originalMessage.content}</div>
        )}
        {renderMessage(message)}
        <div style={styles.Footer}>
          <span style={styles.TimeStamp}>
            {`${new Date(message.sent).getHours()}:${String(
              new Date(message.sent).getMinutes()
            ).padStart(2, "0")}`}
          </span>
          {isRead ? (
            <span style={styles.ReadCheckmark}>&#x2713;&#x2713;</span>
          ) : (
            <span style={styles.UnreadCheckmark}>&#x2713;</span>
          )}
        </div>
      </div>
      <div style={styles.ReactionAndReplyDiv}>
        {reactions.map((emoji, index) => (
          <span
            key={index}
            className="emoji-reaction"
            onClick={() => handleEmojiPick(emoji)}
            role="img"
            aria-label={`emoji-reaction-${index}`}
          >
            {emoji}
          </span>
        ))}
        {showEmojiPicker && <EmojiPicker onSelect={handleSelect} />}
      </div>
    </li>
  );
};
export default MessageItem;
