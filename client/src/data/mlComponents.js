const ML_COMPONENTS = {
  Data: [
    {
      type: "ImageLoader",
      label: "Image Loader",
      icon: "📷",
      color: "#10b981",
      defaults: { dataset: "CIFAR-10", batchSize: 32, shuffle: true },
      inputs: [],
      outputs: [{ id: "out", type: "data", label: "Data" }],
    },
    {
      type: "CSVLoader",
      label: "CSV Loader",
      icon: "📊",
      color: "#10b981",
      defaults: { filePath: "", delimiter: ",", hasHeader: true },
      inputs: [],
      outputs: [{ id: "out", type: "data", label: "Data" }],
    },
    {
      type: "TrainTestSplit",
      label: "Train/Test Split",
      icon: "✂️",
      color: "#34d399",
      defaults: { testSize: 0.2, randomState: 42 },
      inputs: [{ id: "in", type: "data", label: "Data" }],
      outputs: [{ id: "out", type: "data", label: "Data" }],
    },
  ],
  Structure: [
    {
      type: "Input",
      label: "Input",
      icon: "→",
      color: "#06b6d4",
      defaults: { shape: "28,28,1" },
      inputs: [],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "Concatenate",
      label: "Concatenate",
      icon: "⇌",
      color: "#ec4899",
      defaults: { axis: -1 },
      inputs: [
        { id: "in1", type: "data", label: "Input 1" },
        { id: "in2", type: "data", label: "Input 2" },
      ],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
  ],
  Layers: [
    {
      type: "Dense",
      label: "Dense Layer",
      icon: "▣",
      color: "#3b82f6",
      defaults: { units: 128, activation: "relu" },
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "Conv2D",
      label: "Conv2D",
      icon: "⊞",
      color: "#2563eb",
      defaults: { filters: 32, kernelSize: 3, activation: "relu", padding: "same" },
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "MaxPool2D",
      label: "MaxPool2D",
      icon: "⊟",
      color: "#1d4ed8",
      defaults: { poolSize: 2 },
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "Flatten",
      label: "Flatten",
      icon: "▭",
      color: "#60a5fa",
      defaults: {},
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "Dropout",
      label: "Dropout",
      icon: "◌",
      color: "#93c5fd",
      defaults: { rate: 0.25 },
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
  ],
  Activation: [
    {
      type: "ReLU",
      label: "ReLU",
      icon: "⚡",
      color: "#f59e0b",
      defaults: {},
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "Softmax",
      label: "Softmax",
      icon: "〰",
      color: "#fbbf24",
      defaults: {},
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
    {
      type: "Sigmoid",
      label: "Sigmoid",
      icon: "∿",
      color: "#f97316",
      defaults: {},
      inputs: [{ id: "in", type: "data", label: "Input" }],
      outputs: [{ id: "out", type: "data", label: "Output" }],
    },
  ],
  Output: [
    {
      type: "Evaluate",
      label: "Evaluate",
      icon: "📋",
      color: "#ef4444",
      defaults: { metrics: "accuracy" },
      inputs: [{ id: "in", type: "data", label: "Model" }],
      outputs: [],
    },
  ],
};

export const getComponentDef = (type) => {
  for (const components of Object.values(ML_COMPONENTS)) {
    const found = components.find((c) => c.type === type);
    if (found) return found;
  }
  return null;
};

export default ML_COMPONENTS;