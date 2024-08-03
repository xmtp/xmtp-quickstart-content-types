import React, { useState, useRef } from "react";

export const MessageInput = ({
  onSendMessage,
  onFileUpload,
  isLoadingUpload,
  loadingText,
  replyingToMessage,
}) => {
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
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    setNewMessage(file?.name || file?.type);
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
    setNewMessage(file?.name);
    setImage(file);
    onFileUpload(file);
  };

  const handleAudioStart = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        setAudioBlob(audioBlob); // Set the audioBlob state
        const audioDuration =
          audioChunks.reduce((total, chunk) => total + chunk.size, 0) /
          (16 * 1024); // Assuming 16kbps bitrate
        setNewMessage(`${audioDuration.toFixed(2)} seconds`);
        setIsRecording(false);
        onFileUpload(audioBlob); // Upload the audio file here
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    });
  };

  const handleAudioStop = () => {
    mediaRecorderRef.current.stop();
  };

  const handleSend = () => {
    onSendMessage(newMessage, image ?? audioBlob, replyingToMessage);
    setImage(null);
    setAudioBlob(null);
    setNewMessage("");
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
            onClick={isRecording ? handleAudioStop : handleAudioStart}>
            {isRecording ? "⏹️" : "🎙️"}
          </button>
          <button style={styles.sendButton} onClick={handleSend}>
            Send
          </button>
        </>
      )}
    </div>
  );
};
