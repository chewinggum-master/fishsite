const screens = document.querySelectorAll("[data-screen]");
const video = document.querySelector("#cameraFeed");
const canvas = document.querySelector("#canvas");
const resultImage = document.querySelector("#resultImage");
const downloadPhoto = document.querySelector("#downloadPhoto");
const cameraError = document.querySelector("#cameraError");

let stream = null;

const copy = {
  cameraHint: "隨便拍拍(直的拜託)",
  cameraError: "相機開不起來，請確認瀏覽器有允許相機權限。",
  developing: "巴拉巴拉",
  photoCaption: "七夕快樂",
  resultEyebrow: "然後...",
  download: "下載圖片ㄦ",
  startOver: "重新開始",
};

document.querySelector("#cameraHint").textContent = copy.cameraHint;
document.querySelector("#cameraErrorText").textContent = copy.cameraError;
document.querySelector("#developingText").textContent = copy.developing;
document.querySelector("#photoCaption").textContent = copy.photoCaption;
document.querySelector("#resultEyebrow").textContent = copy.resultEyebrow;
downloadPhoto.textContent = copy.download;
document.querySelector("#startOver").textContent = copy.startOver;

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

function getCoverCrop(sourceWidth, sourceHeight, targetRatio) {
  const sourceRatio = sourceWidth / sourceHeight;

  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return {
      x: (sourceWidth - width) / 2,
      y: 0,
      width,
      height: sourceHeight,
    };
  }

  const height = sourceWidth / targetRatio;
  return {
    x: 0,
    y: (sourceHeight - height) / 2,
    width: sourceWidth,
    height,
  };
}

async function addFlower(source, width, height) {
  const isVideo = source instanceof HTMLVideoElement;
  const viewportRatio = window.innerWidth / window.innerHeight;
  const shouldUseViewportCrop = isVideo && window.innerHeight > window.innerWidth;
  const crop = shouldUseViewportCrop ? getCoverCrop(width, height, viewportRatio) : null;
  const outputWidth = crop ? crop.width : width;
  const outputHeight = crop ? crop.height : height;
  const ratio = Math.min(1, 1800 / Math.max(outputWidth, outputHeight));

  canvas.width = Math.round(outputWidth * ratio);
  canvas.height = Math.round(outputHeight * ratio);

  const context = canvas.getContext("2d");

  if (crop) {
    context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  } else {
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  const flower = new Image();
  flower.src = "assets/flower.png";
  await flower.decode();

  const isPortrait = canvas.height > canvas.width;
  const flowerWidth = canvas.width * (isPortrait ? 0.5 : 0.46);
  const flowerHeight = flowerWidth * (flower.height / flower.width);
  const x = isPortrait ? 0 : canvas.width * 0.04;
  const y = isPortrait
    ? canvas.height - flowerHeight
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
