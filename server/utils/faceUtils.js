const { Canvas, Image, ImageData } = require('canvas');
const faceapi = require('@vladmandic/face-api');
const fetch = require('node-fetch');
const path = require('path');


// ✅ Use @tensorflow/tfjs instead of tfjs-node
const tf = require('@tensorflow/tfjs');

// Patch global for node
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

const modelPath = path.join(__dirname, '..', 'models');

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
}

async function saveImageAndExtractDescriptor(imageBase64) {
  await loadModels();

  const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const img = new Image();
  img.src = buffer;

  const detections = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections) throw new Error('No face detected');

  return Array.from(detections.descriptor); // convert Float32Array to regular array
}

function compareDescriptors(descriptor1, descriptor2) {
  const f1 = new Float32Array(descriptor1);
  const f2 = new Float32Array(descriptor2);
  return faceapi.euclideanDistance(f1, f2);
}

module.exports = {
  saveImageAndExtractDescriptor,
  compareDescriptors,
};
