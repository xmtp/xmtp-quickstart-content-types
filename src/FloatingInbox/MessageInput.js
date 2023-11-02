import React, { useState } from "react";

const styles = {
  newMessageContainer: {
    display: "flex",
    alignItems: "center",
    paddingLeft: "10px",
    paddingRight: "10px",
    flexWrap: "wrap",
  },
  messageInputField: {
    flexGrow: 1,
    padding: "5px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  sendButton: {
    padding: "5px 10px",
    marginLeft: "5px",
    border: "1px solid #ccc",
    cursor: "pointer",
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    hover: {
      textDecoration: "underline",
    },
  },
  sendButtonUpload: {
    padding: "3px",
    paddingTop: "0px",
    paddingBottom: "0px",
    marginLeft: "5px",
    border: "1px solid #ccc",
    cursor: "pointer",
    borderRadius: "5px",
    display: "flex",
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
