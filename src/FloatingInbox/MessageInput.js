import React, { useState } from "react";

const styles = {
  newMessageContainer: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    justifyContent: "space-between",
  },
  messageInputField: {
    width: "62%",
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  sendButton: {
    width: "20%",
    padding: "2px",
    border: "1px solid #ccc",
    cursor: "pointer",
    height: "100%",
    borderRadius: "5px",
    alignItems: "center",
  },
  sendButtonUpload: {
    width: "10%",
    height: "100%",
    border: "1px solid #ccc",
    cursor: "pointer",
    borderRadius: "5px",
    alignItems: "center",
    textAlign: "center",
  },
  replyingTo: {
    fontSize: "10px",
    color: "grey",
    paddingBottom: "5px",
    wordBreak: "break-all",
    backgroundColor: "lightblue",
    width: "100%",
  },
};

export const MessageInput = ({
  onSendMessage,
  onFileUpload,
  isLoadingUpload,
  loadingText,
  replyingToMessage,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    setNewMessage(file.name);
    setImage(file);
    onFileUpload(file);
  };

  const handleInputChange = (event) => {
    if (event.key === "Enter") {
      onSendMessage(newMessage, image, replyingToMessage);
      setNewMessage("");
      setImage(null);
    } else {
      setNewMessage(event.target.value);
      setImage(null);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event?.target?.files[0];
    setNewMessage(file.name);
    setImage(file);
    onFileUpload(file);
  };

  return (
    <div
      style={styles.newMessageContainer}
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}>
      {isLoadingUpload ? (
        <small>{loadingText}</small>
      ) : (
        <>
          {replyingToMessage && (
            <div style={styles.replyingTo}>
              Replying to: {replyingToMessage.content}
            </div>
          )}
          <input
            style={styles.messageInputField}
            type="text"
            value={newMessage}
            onKeyPress={handleInputChange}
            onChange={handleInputChange}
            placeholder="Type your message or upload an image..."
          />
          <input
            type="file"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
            id="image-upload"
          />
          <label style={styles.sendButtonUpload} htmlFor="image-upload">
            📤
          </label>
          <button
            style={styles.sendButton}
            onClick={() => {
              onSendMessage(newMessage, image, replyingToMessage);
              setNewMessage("");
              setImage(null);
            }}>
            Send
          </button>
        </>
      )}
    </div>
  );
};
