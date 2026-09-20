const form = document.getElementById('avatarForm');
const imageUpload = document.getElementById('imageUpload');
const audioUpload = document.getElementById('audioUpload');
const maskUpload = document.getElementById('maskUpload');
const motionPrompt = document.getElementById('motionPrompt');
const resolution = document.getElementById('resolution');
const duration = document.getElementById('duration');
const style = document.getElementById('style');
const generateBtn = document.getElementById('generateBtn');
const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusText = document.getElementById('statusText');
const videoPreview = document.getElementById('videoPreview');
const imagePreview = document.getElementById('imagePreview');
const audioPreview = document.getElementById('audioPreview');
const maskPreview = document.getElementById('maskPreview');

let generatedVideoUrl = '';
let generatedVideoBlob = null;

function setStatus(message) {
  statusText.textContent = message;
}

function updateUploadPreview(file, previewElement, isAudio = false) {
  if (!file) {
    previewElement.hidden = true;
    return;
  }

  const url = URL.createObjectURL(file);
  previewElement.src = url;
  previewElement.hidden = false;

  if (isAudio) {
    previewElement.load();
  }
}

imageUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  updateUploadPreview(file, imagePreview, false);
  setStatus('Image ready. Add audio to continue.');
});

audioUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  updateUploadPreview(file, audioPreview, true);
  setStatus('Audio ready. Add optional mask and prompt.');
});

maskUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  updateUploadPreview(file, maskPreview, false);
  setStatus('Mask ready. You can now generate the avatar.');
});

function getPromptText() {
  return motionPrompt.value.trim() || 'Turn your head a little, smile at the camera, and speak with a calm, natural motion.';
}

function drawScene(context, image, maskImage, progress, promptText, styleName) {
  const width = context.canvas.width;
  const height = context.canvas.height;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#1d4ed8');
  gradient.addColorStop(1, '#0f172a');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = 'rgba(255,255,255,0.05)';
  context.fillRect(20, 20, width - 40, height - 40);

  const bounce = Math.sin(progress * Math.PI * 2) * 18;
  const nod = Math.sin(progress * Math.PI * 3) * 10;

  const avatarX = width * 0.5;
  const avatarY = height * 0.54 + nod;
  const avatarRadius = Math.min(width, height) * 0.28;

  context.save();
  context.beginPath();
  context.arc(avatarX, avatarY, avatarRadius + 26, 0, Math.PI * 2);
  context.clip();

  if (image && image.width) {
    const scale = Math.max(avatarRadius * 2.4 / image.width, avatarRadius * 2.6 / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const x = avatarX - w / 2;
    const y = avatarY - h / 2 + bounce;

    context.drawImage(image, x, y, w, h);
  }

  if (maskImage && maskImage.width) {
    context.globalAlpha = 0.65;
    const maskScale = Math.max((avatarRadius * 2.2) / maskImage.width, (avatarRadius * 2.2) / maskImage.height);
    const mw = maskImage.width * maskScale;
    const mh = maskImage.height * maskScale;
    context.drawImage(maskImage, avatarX - mw / 2, avatarY - mh / 2 + bounce, mw, mh);
  }

  context.restore();

  context.beginPath();
  context.arc(avatarX, avatarY, avatarRadius + 10, 0, Math.PI * 2);
  context.strokeStyle = 'rgba(255,255,255,0.3)';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = 'rgba(15, 23, 42, 0.8)';
  context.fillRect(40, height - 120, width - 80, 80);

  context.font = '600 32px Inter, sans-serif';
  context.fillStyle = '#f8fafc';
  context.fillText(`Style: ${styleName}`, 60, height - 72);

  context.font = '500 24px Inter, sans-serif';
  context.fillStyle = '#cbd5e1';
  const wrapped = wrapText(context, promptText, width - 160);
  wrapped.slice(0, 2).forEach((line, index) => {
    context.fillText(line, 60, height - 32 - index * 28);
  });
}

function wrapText(context, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = words[0] || '';

  for (let i = 1; i < words.length; i += 1) {
    const test = `${current} ${words[i]}`;
    if (context.measureText(test).width > maxWidth) {
      lines.push(current);
      current = words[i];
    } else {
      current = test;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function cleanupVideoUrl() {
  if (generatedVideoUrl) {
    URL.revokeObjectURL(generatedVideoUrl);
  }
}

async function generateVideoFromInputs(event) {
  event.preventDefault();

  const imageFile = imageUpload.files?.[0];
  const audioFile = audioUpload.files?.[0];

  if (!imageFile || !audioFile) {
    setStatus('Please upload both an image and an audio clip before generating.');
    return;
  }

  setStatus('Rendering your avatar video...');
  generateBtn.disabled = true;
  previewBtn.disabled = true;

  const promptText = getPromptText();
  const selectedDuration = Number(duration.value || 31);
  const selectedStyle = style.value || 'Realistic';
  const selectedResolution = resolution.value || '1080p';

  try {
    const image = await loadImageFromFile(imageFile);
    const maskImage = maskUpload.files?.[0] ? await loadImageFromFile(maskUpload.files[0]) : null;

    const canvas = document.createElement('canvas');
    const pixelRatio = selectedResolution === '720p' ? 1 : 1.5;
    canvas.width = 1280 * pixelRatio;
    canvas.height = 720 * pixelRatio;

    const stream = canvas.captureStream(30);
    const audioUrl = URL.createObjectURL(audioFile);
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination);

    const audioTrack = destination.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }

    const recorderOptions = {};
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      recorderOptions.mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      recorderOptions.mimeType = 'video/webm;codecs=vp8';
    }

    const recorder = new MediaRecorder(stream, recorderOptions);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      cleanupVideoUrl();
      generatedVideoBlob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      generatedVideoUrl = URL.createObjectURL(generatedVideoBlob);
      videoPreview.src = generatedVideoUrl;
      videoPreview.poster = imagePreview.src;
      previewBtn.disabled = false;
      downloadBtn.href = generatedVideoUrl;
      downloadBtn.hidden = false;
      setStatus('Video ready. Preview and download are available.');
      generateBtn.disabled = false;
      audio.pause();
      audio.src = '';
      audioContext.close();
    };

    const context = canvas.getContext('2d');
    const renderStart = performance.now();

    const renderFrame = (now) => {
      const elapsed = (now - renderStart) / 1000;
      const progress = Math.min(elapsed / selectedDuration, 1);
      drawScene(context, image, maskImage, progress, promptText, selectedStyle);

      if (progress < 1) {
        requestAnimationFrame(renderFrame);
      } else {
        recorder.stop();
      }
    };

    recorder.start();
    audio.play().then(() => {
      requestAnimationFrame(renderFrame);
    }).catch(() => {
      requestAnimationFrame(renderFrame);
      setStatus('Audio playback was blocked, but the video was still rendered.');
    });
  } catch (error) {
    console.error(error);
    setStatus('Generation failed. Please check the uploaded files and try again.');
    generateBtn.disabled = false;
  }
}

previewBtn.addEventListener('click', () => {
  if (!generatedVideoUrl) {
    setStatus('Generate a video before previewing.');
    return;
  }

  setStatus('Playing MP4 preview...');
  videoPreview.play();
});

form.addEventListener('submit', generateVideoFromInputs);

if (typeof MediaRecorder === 'undefined') {
  setStatus('This browser does not support MediaRecorder, so MP4 export is unavailable.');
  generateBtn.disabled = true;
}
