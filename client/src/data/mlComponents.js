const ML_COMPONENTS = {
  Data: [
    {
      type: "ImageLoader",
      label: "Image Loader",
      icon: "📷",
      color: "#10b981",
      defaults: { dataset: "CIFAR-10", batchSize: 32, shuffle: true },
    },
    {
      type: "CSVLoader",
      label: "CSV Loader",
      icon: "📊",
      color: "#10b981",
      defaults: { filePath: "", delimiter: ",", hasHeader: true },
    },
    {
      type: "TrainTestSplit",
      label: "Train/Test Split",
      icon: "✂️",
      color: "#34d399",
      defaults: { testSize: 0.2, randomState: 42 },
    },
  ],
  Layers: [
    {
      type: "Dense",
      label: "Dense Layer",
      icon: "▣",
      color: "#3b82f6",
      defaults: { units: 128, activation: "relu" },
    },
    {
      type: "Conv2D",
      label: "Conv2D",
      icon: "⊞",
      color: "#2563eb",
      defaults: { filters: 32, kernelSize: 3, activation: "relu", padding: "same" },
    },
    {
      type: "MaxPool2D",
      label: "MaxPool2D",
      icon: "⊟",
      color: "#1d4ed8",
      defaults: { poolSize: 2 },
    },
    {
      type: "Flatten",
      label: "Flatten",
      icon: "▭",
      color: "#60a5fa",
      defaults: {},
    },
    {
      type: "Dropout",
      label: "Dropout",
      icon: "◌",
      color: "#93c5fd",
      defaults: { rate: 0.25 },
    },
  ],
  Activation: [
    {
      type: "ReLU",
      label: "ReLU",
      icon: "⚡",
      color: "#f59e0b",
      defaults: {},
    },
    {
      type: "Softmax",
      label: "Softmax",
      icon: "〰",
      color: "#fbbf24",
      defaults: {},
    },
    {
      type: "Sigmoid",
      label: "Sigmoid",
      icon: "∿",
      color: "#f97316",
      defaults: {},
    },
  ],
  Training: [
    {
      type: "Optimizer",
      label: "Optimizer",
      icon: "⚙",
      color: "#8b5cf6",
      defaults: { type: "Adam", learningRate: 0.001 },
    },
    {
      type: "LossFunction",
      label: "Loss Function",
      icon: "📉",
      color: "#a78bfa",
      defaults: { type: "SparseCategoricalCrossentropy" },
    },
    {
      type: "TrainBlock",
      label: "Train",
      icon: "▶",
      color: "#7c3aed",
      defaults: { epochs: 10, batchSize: 32 },
    },
  ],
  Output: [
    {
      type: "Evaluate",
      label: "Evaluate",
      icon: "📋",
      color: "#ef4444",
      defaults: { metrics: "accuracy" },
    },
  ],
};

export default ML_COMPONENTS;
