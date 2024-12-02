import React, { useRef, useState } from "react";

const WebcamRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkSize = 5 * 1024 * 1024; // 5 MB in bytes
  console.log("ChunkRef", chunksRef.current);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const startRecording = () => {
    chunksRef.current = [];
    const recorder = new MediaRecorder(mediaStream, {
      mimeType: "video/webm; codecs=vp8",
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
        // Check if chunk size exceeds the limit
        if (getTotalChunkSize() >= chunkSize) {
          processChunk();
        }
      }
    };

    recorder.start(1000); // 1-second chunks
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      processChunk(); // Process the last chunk after stopping the recording
    }
  };

  const getTotalChunkSize = () => {
    return chunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
  };

  const processChunk = () => {
    const chunkBlob = new Blob(chunksRef.current, { type: "video/webm" });
    uploadChunkToAzure(chunkBlob); // Use your upload function
    chunksRef.current = []; // Reset chunks after upload
  };

  // Your provided upload function to Azure
  const uploadChunkToAzure = async (chunk) => {
    console.log("Uploading chunk:", chunk); // Log chunk to see data being uploaded
    try {
      const response = await fetch(
        "http://98.70.51.188/api/trainer/presigned-url",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get pre-signed URL");
      }

      const data = await response.json();
      const { url, key } = data;

      console.log("Received pre-signed URL and key:", { url, key });

      const uploadResponse = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "video/webm",
          "x-ms-blob-type": "BlockBlob",
        },
        body: chunk,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload chunk to Azure");
      }

      console.log(`Chunk uploaded successfully with key: ${key}`);
    } catch (error) {
      console.error("Error uploading chunk to Azure:", error);
    }
  };

  return (
    <div>
      <h1>Webcam Recorder</h1>
      <video ref={videoRef} autoPlay muted></video>
      <div>
        <button onClick={startWebcam} disabled={mediaStream}>
          Start Webcam
        </button>
        <button onClick={startRecording} disabled={!mediaStream || isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>
    </div>
  );
};

export default WebcamRecorder;
