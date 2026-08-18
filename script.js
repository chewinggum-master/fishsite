const screens = document.querySelectorAll("[data-screen]");
const video = document.querySelector("#cameraFeed");
const canvas = document.querySelector("#canvas");
const resultImage = document.querySelector("#resultImage");
const downloadPhoto = document.querySelector("#downloadPhoto");
const cameraError = document.querySelector("#cameraError");

let stream = null;

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });
}

function stopCamera() {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
  stream = null;
}

async function openCamera() {
  showScreen("camera");
  cameraError.hidden = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (error) {
    cameraError.hidden = false;
  }
}

async function addFlower(source, width, height) {
  const ratio = Math.min(1, 1800 / Math.max(width, height));
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const context = canvas.getContext("2d");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  const flower = new Image();
  flower.src = "assets/flower.png";
  await flower.decode();

  const isPortrait = canvas.height > canvas.width;
  const flowerWidth = canvas.width * (isPortrait ? 0.48 : 0.46);
  const flowerHeight = flowerWidth * (flower.height / flower.width);
  const x = isPortrait ? canvas.width * -0.12 : canvas.width * 0.04;
  const y = isPortrait
    ? canvas.height - flowerHeight - canvas.height * 0.075
    : Math.max(0, canvas.height - flowerHeight - canvas.height * 0.02);

  context.save();
  context.shadowColor = "rgba(32, 22, 24, 0.2)";
  context.shadowBlur = Math.max(10, canvas.width * 0.012);
  context.drawImage(flower, x, y, flowerWidth, flowerHeight);
  context.restore();

  stopCamera();
  showScreen("developing");

  window.setTimeout(() => {
    const url = canvas.toDataURL("image/jpeg", 0.94);
    resultImage.src = url;
    downloadPhoto.href = url;
    showScreen("result");
  }, 900);
}

function takePhoto() {
  if (!video.videoWidth) return;
  addFlower(video, video.videoWidth, video.videoHeight);
}

function reset() {
  stopCamera();
  resultImage.removeAttribute("src");
  downloadPhoto.removeAttribute("href");
  showScreen("intro");
}

document.querySelector("#openCamera").addEventListener("click", openCamera);
document.querySelector("#takePhoto").addEventListener("click", takePhoto);
document.querySelector("#closeCamera").addEventListener("click", reset);
document.querySelector("#startOver").addEventListener("click", reset);

window.addEventListener("beforeunload", stopCamera);
