/**
 * projectTemplates.js - Built-in starter templates
 *
 * Each template is a fully self-contained pipeline with pre-wired blocks and
 * connections. Templates load client-side; no server call is needed.
 *
 * Block IDs use a "tN-bM" convention (template N, block M) so they can never
 * collide with user-created block IDs ("block-N").
 *
 * connectedOutputs / connectedInputs must mirror the connections array exactly
 * so that the canvas and code generator both function correctly after loading.
 */

const TEMPLATES = [
    // 1. MNIST Dense Classifier
    {
      id: "mnist-dense",
      name: "MNIST Digit Classifier",
      description:
        "A fully-connected network that classifies handwritten digits (0–9) " +
        "from the MNIST dataset. Good starting point for learning Dense layers.",
      difficulty: "beginner",
      tags: ["classification", "dense", "mnist"],
      trainingSettings: {
        optimizer: "Adam",
        learningRate: 0.001,
        loss: "SparseCategoricalCrossentropy",
        epochs: 10,
        batchSize: 32,
        testSize: 0.2,
      },
      blocks: [
        {
          id: "t1-b1",
          type: "ImageLoader",
          label: "Image Loader",
          x: 80, y: 80,
          properties: { dataset: "MNIST", batchSize: 32, shuffle: true },
          connectedOutputs: {},
          connectedInputs: {},
          lockedProperties: [],
        },
        {
          id: "t1-b2",
          type: "Input",
          label: "Input",
          x: 80, y: 280,
          properties: { shape: "28,28,1" },
          connectedOutputs: { out: [{ targetBlockId: "t1-b3", targetPort: "in" }] },
          connectedInputs: {},
          lockedProperties: [],
        },
        {
          id: "t1-b3",
          type: "Flatten",
          label: "Flatten",
          x: 310, y: 280,
          properties: {},
          connectedOutputs: { out: [{ targetBlockId: "t1-b4", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t1-b2", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t1-b4",
          type: "Dense",
          label: "Dense Layer",
          x: 540, y: 280,
          properties: { units: 128, activation: "relu" },
          connectedOutputs: { out: [{ targetBlockId: "t1-b5", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t1-b3", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t1-b5",
          type: "Dense",
          label: "Dense Layer",
          x: 770, y: 280,
          properties: { units: 10, activation: "softmax" },
          connectedOutputs: {},
          connectedInputs: { in: { sourceBlockId: "t1-b4", sourcePort: "out" } },
          lockedProperties: [],
        },
      ],
      connections: [
        { id: "t1-c1", fromBlockId: "t1-b2", fromPort: "out", toBlockId: "t1-b3", toPort: "in" },
        { id: "t1-c2", fromBlockId: "t1-b3", fromPort: "out", toBlockId: "t1-b4", toPort: "in" },
        { id: "t1-c3", fromBlockId: "t1-b4", fromPort: "out", toBlockId: "t1-b5", toPort: "in" },
      ],
    },
  
    // 2. CIFAR-10 CNN
    {
      id: "cifar-cnn",
      name: "CIFAR-10 Image Classifier (CNN)",
      description:
        "A convolutional network for classifying 32×32 colour images across " +
        "10 categories. Demonstrates Conv2D, MaxPooling, and Flatten layers.",
      difficulty: "intermediate",
      tags: ["classification", "cnn", "cifar"],
      trainingSettings: {
        optimizer: "Adam",
        learningRate: 0.001,
        loss: "SparseCategoricalCrossentropy",
        epochs: 15,
        batchSize: 64,
        testSize: 0.2,
      },
      blocks: [
        {
          id: "t2-b1",
          type: "ImageLoader",
          label: "Image Loader",
          x: 80, y: 80,
          properties: { dataset: "CIFAR-10", batchSize: 64, shuffle: true },
          connectedOutputs: {},
          connectedInputs: {},
          lockedProperties: [],
        },
        {
          id: "t2-b2",
          type: "Input",
          label: "Input",
          x: 80, y: 280,
          properties: { shape: "32,32,3" },
          connectedOutputs: { out: [{ targetBlockId: "t2-b3", targetPort: "in" }] },
          connectedInputs: {},
          lockedProperties: [],
        },
        {
          id: "t2-b3",
          type: "Conv2D",
          label: "Conv2D",
          x: 310, y: 280,
          properties: { filters: 32, kernelSize: 3, activation: "relu", padding: "same" },
          connectedOutputs: { out: [{ targetBlockId: "t2-b4", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t2-b2", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t2-b4",
          type: "MaxPool2D",
          label: "MaxPool2D",
          x: 540, y: 280,
          properties: { poolSize: 2 },
          connectedOutputs: { out: [{ targetBlockId: "t2-b5", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t2-b3", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t2-b5",
          type: "Conv2D",
          label: "Conv2D",
          x: 770, y: 280,
          properties: { filters: 64, kernelSize: 3, activation: "relu", padding: "same" },
          connectedOutputs: { out: [{ targetBlockId: "t2-b6", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t2-b4", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t2-b6",
          type: "MaxPool2D",
          label: "MaxPool2D",
          x: 1000, y: 280,
          properties: { poolSize: 2 },
          connectedOutputs: { out: [{ targetBlockId: "t2-b7", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t2-b5", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t2-b7",
          type: "Flatten",
          label: "Flatten",
          x: 1230, y: 280,
          properties: {},
          connectedOutputs: { out: [{ targetBlockId: "t2-b8", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t2-b6", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t2-b8",
          type: "Dense",
          label: "Dense Layer",
          x: 1460, y: 280,
          properties: { units: 128, activation: "relu" },
          connectedOutputs: { out: [{ targetBlockId: "t2-b9", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t2-b7", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t2-b9",
          type: "Dense",
          label: "Dense Layer",
          x: 1690, y: 280,
          properties: { units: 10, activation: "softmax" },
          connectedOutputs: {},
          connectedInputs: { in: { sourceBlockId: "t2-b8", sourcePort: "out" } },
          lockedProperties: [],
        },
      ],
      connections: [
        { id: "t2-c1", fromBlockId: "t2-b2", fromPort: "out", toBlockId: "t2-b3", toPort: "in" },
        { id: "t2-c2", fromBlockId: "t2-b3", fromPort: "out", toBlockId: "t2-b4", toPort: "in" },
        { id: "t2-c3", fromBlockId: "t2-b4", fromPort: "out", toBlockId: "t2-b5", toPort: "in" },
        { id: "t2-c4", fromBlockId: "t2-b5", fromPort: "out", toBlockId: "t2-b6", toPort: "in" },
        { id: "t2-c5", fromBlockId: "t2-b6", fromPort: "out", toBlockId: "t2-b7", toPort: "in" },
        { id: "t2-c6", fromBlockId: "t2-b7", fromPort: "out", toBlockId: "t2-b8", toPort: "in" },
        { id: "t2-c7", fromBlockId: "t2-b8", fromPort: "out", toBlockId: "t2-b9", toPort: "in" },
      ],
    },
  
    // 3. CSV Binary Classifier
    {
      id: "csv-binary",
      name: "CSV Binary Classifier",
      description:
        "A dense network for binary classification from tabular CSV data. " +
        "Swap in your own file path and adjust the Input shape to match your feature count.",
      difficulty: "beginner",
      tags: ["classification", "csv", "binary", "tabular"],
      trainingSettings: {
        optimizer: "Adam",
        learningRate: 0.001,
        loss: "BinaryCrossentropy",
        epochs: 20,
        batchSize: 32,
        testSize: 0.2,
      },
      blocks: [
        {
          id: "t3-b1",
          type: "CSVLoader",
          label: "CSV Loader",
          x: 80, y: 80,
          properties: { filePath: "data.csv", delimiter: ",", hasHeader: true },
          connectedOutputs: {},
          connectedInputs: {},
          lockedProperties: [],
        },
        {
          id: "t3-b2",
          type: "Input",
          label: "Input",
          x: 80, y: 280,
          properties: { shape: "8" },
          connectedOutputs: { out: [{ targetBlockId: "t3-b3", targetPort: "in" }] },
          connectedInputs: {},
          lockedProperties: [],
        },
        {
          id: "t3-b3",
          type: "Dense",
          label: "Dense Layer",
          x: 310, y: 280,
          properties: { units: 64, activation: "relu" },
          connectedOutputs: { out: [{ targetBlockId: "t3-b4", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t3-b2", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t3-b4",
          type: "Dense",
          label: "Dense Layer",
          x: 540, y: 280,
          properties: { units: 32, activation: "relu" },
          connectedOutputs: { out: [{ targetBlockId: "t3-b5", targetPort: "in" }] },
          connectedInputs: { in: { sourceBlockId: "t3-b3", sourcePort: "out" } },
          lockedProperties: [],
        },
        {
          id: "t3-b5",
          type: "Dense",
          label: "Dense Layer",
          x: 770, y: 280,
          properties: { units: 1, activation: "sigmoid" },
          connectedOutputs: {},
          connectedInputs: { in: { sourceBlockId: "t3-b4", sourcePort: "out" } },
          lockedProperties: [],
        },
      ],
      connections: [
        { id: "t3-c1", fromBlockId: "t3-b2", fromPort: "out", toBlockId: "t3-b3", toPort: "in" },
        { id: "t3-c2", fromBlockId: "t3-b3", fromPort: "out", toBlockId: "t3-b4", toPort: "in" },
        { id: "t3-c3", fromBlockId: "t3-b4", fromPort: "out", toBlockId: "t3-b5", toPort: "in" },
      ],
    },
  ];
  
  export default TEMPLATES;