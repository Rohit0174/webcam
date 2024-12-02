import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import WebcamRecorder from "./components/WebcamRecorder";

function App() {
  return (
    <>
      <div>
        <WebcamRecorder />
      </div>
    </>
  );
}

export default App;
