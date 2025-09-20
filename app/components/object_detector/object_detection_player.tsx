import { runObjectDetections } from "./object_detection";

export const ObjectDetectionPlayer = () => {
  runObjectDetections();
  return (
    <div id="liveView" className="videoView">
      <button id="webcamButton" className="mdc-button mdc-button--raised">
        <span className="mdc-button__ripple"></span>
        <span className="mdc-button__label">ENABLE WEBCAM</span>
      </button>
      <video id="webcam" autoplay playsinline></video>
    </div>
  );
}