import {
  ObjectDetector,
  FilesetResolver,
  ObjectDetectorResult
} from "@mediapipe/tasks-vision";

export function runObjectDetections() {
  const demosSection = document.getElementById("demos") as HTMLElement;

  let objectDetector: ObjectDetector;

  const initializeObjectDetector = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
    );
    objectDetector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
        delegate: "GPU"
      },
      scoreThreshold: 0.5,
      runningMode: "VIDEO"
    });
    demosSection.classList.remove("invisible");
  };
  initializeObjectDetector();

  let video = document.getElementById("webcam") as HTMLVideoElement;
  if (!video) return;
  const liveView = document.getElementById("liveView");
  if (!liveView) return;
  let enableWebcamButton: HTMLButtonElement | null;
  // Check if webcam access is supported.
  function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Keep a reference of all the child elements we create
  // so we can remove them easilly on each render.
  const children: HTMLElement[] = [];

  // If webcam supported, add event listener to button for when user
  // wants to activate it.
  if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
    enableWebcamButton?.addEventListener("click", enableCam);
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }

  // Enable the live webcam view and start detection.
  async function enableCam(event) {
    if (!objectDetector) {
      console.log("Wait! objectDetector not loaded yet.");
      return;
    }

    // Hide the button.
    if (enableWebcamButton) {
      enableWebcamButton.classList.add("removed");
    }

    // getUsermedia parameters
    const constraints = {
      video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
      })
      .catch((err) => {
        console.error(err);
        /* handle the error */
      });
  }

  let lastVideoTime = -1;
  async function predictWebcam() {
    // if image mode is initialized, create a new classifier with video runningMode.
    let startTimeMs = performance.now();


    // Detect objects using detectForVideo.
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const detections = objectDetector.detectForVideo(video, startTimeMs);
      displayVideoDetections(detections);
    }
    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  }

  function displayVideoDetections(result: ObjectDetectorResult) {
    // Remove any highlighting from previous frame.
    for (let child of children) {
      liveView?.removeChild(child);
    }
    children.splice(0);
    // Iterate through predictions and draw them to the live view
    for (let detection of result.detections) {
      if (!detection.boundingBox) continue;
      const p = document.createElement("p");
      p.innerText =
        detection.categories[0].categoryName +
        " - with " +
        Math.round(detection.categories[0].score * 100) +
        "% confidence.";
      p.setAttribute('style', "left: " +
        (video.offsetWidth -
          detection.boundingBox.width -
          detection.boundingBox.originX) +
        "px;" +
        "top: " +
        detection.boundingBox.originY +
        "px; " +
        "width: " +
        (detection.boundingBox.width - 10) +
        "px;");

      const highlighter = document.createElement("div");
      highlighter.setAttribute("class", "highlighter");
      highlighter.setAttribute('style',
        "left: " +
        (video.offsetWidth -
          detection.boundingBox.width -
          detection.boundingBox.originX) +
        "px;" +
        "top: " +
        detection.boundingBox.originY +
        "px;" +
        "width: " +
        (detection.boundingBox.width - 10) +
        "px;" +
        "height: " +
        detection.boundingBox.height +
        "px;");

      liveView?.appendChild(highlighter);
      liveView?.appendChild(p);

      // Store drawn objects in memory so they are queued to delete at next call.
      children.push(highlighter);
      children.push(p);
    }
  }
}