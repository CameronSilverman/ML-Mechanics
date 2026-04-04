/**
 * lessons.js — ML Maker Studio lesson registry
 *
 * To add a new lesson: push a new object to LESSONS. No other file needs changes.
 *
 *  Lesson shape
 * {
 *   id:                    string
 *   title:                 string
 *   category:              string          — groups lessons on the Learn home page
 *   difficulty:            'beginner' | 'intermediate' | 'advanced'
 *   estimatedMinutes:      number
 *   description:           string          — shown on the lesson card only
 *   objectives:            string[]        — bullet list shown in the Lesson tab header
 *
 *   lockedTrainingSettings: object | null  — locks TrainingSettingsPanel
 *     { optimizer, learningRate, loss, epochs, batchSize }
 *
 *   initialBlocks: Array<{
 *     type:               string           — must match mlComponents.js type key
 *     x:                  number
 *     y:                  number
 *     overrideProperties: object           — merged over component defaults
 *     lockedProperties:   string[]         — keys that cannot be edited
 *   }>
 *
 *   Rich content blocks (rendered in the "Lesson" tab)
 *
 *   content: Array<ContentBlock>
 *
 *   ContentBlock types:
 *
 *   { type: "text", body: string }
 *     Plain prose paragraph.
 *
 *   { type: "heading", level: 2|3, body: string }
 *     Section heading inside the lesson body.
 *
 *   { type: "callout", variant: "info"|"tip"|"warning"|"math", title?: string, body: string }
 *     Colored aside box.
 *
 *   { type: "code", language?: string, body: string }
 *     Syntax-highlighted code snippet (Python highlighting built in).
 *
 *   { type: "image", src: string, alt?: string, caption?: string }
 *     Inline figure. src can be a relative path or a full URL.
 *
 *   { type: "video", src: string, caption?: string }
 *     <video> element with controls.
 *
 *   { type: "divider" }
 *     Horizontal rule.
 *
 *   Steps (rendered in the "Steps" tab)
 *
 *   steps: Array<{
 *     id:          string
 *     title:       string
 *     description: string
 *     hint:        string | null
 *     validate:    (blocks, connections) => boolean
 *   }>
 *
 *   Solution (used by solutionChecker)
 *
 *   solution: {
 *     requiredBlocks: Array<{ type, requiredProperties }>
 *     requiredConnectionSequence: Array<{ fromType, toType }> | null
 *   }
 * }
 */

const LESSONS = [
  // --- Fundamentals ---
  {
    id: "dense-intro",
    title: "Your First Dense Network",
    category: "Fundamentals",
    difficulty: "beginner",
    estimatedMinutes: 10,
    description:
      "Learn how Dense (fully connected) layers work by building a simple digit classifier from scratch.",
    objectives: [
      "Understand the role of a Dense layer",
      "Configure units and activation functions",
      "Connect layers using the canvas port system",
    ],

    lockedTrainingSettings: {
      optimizer: "Adam",
      learningRate: 0.001,
      loss: "SparseCategoricalCrossentropy",
      epochs: 5,
      batchSize: 32,
    },

    initialBlocks: [
      {
        type: "Input",
        x: 80,
        y: 200,
        overrideProperties: { shape: "784" },
        lockedProperties: ["shape"],
      },
    ],

    content: [
      {
        type: "text",
        body:
          "A neural network is made of layers. The simplest and most fundamental " +
          "layer type is the Dense layer — also called a fully connected layer — " +
          "where every input neuron is connected to every output neuron.",
      },
      {
        type: "image",
        src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/400px-Colored_neural_network.svg.png",
        alt: "Diagram of a fully connected neural network",
        caption:
          "A fully connected network: every node in one layer connects to every node in the next.",
      },
      {
        type: "heading",
        level: 3,
        body: "How a Dense layer works",
      },
      {
        type: "text",
        body:
          "Each neuron in a Dense layer computes a weighted sum of its inputs, " +
          "adds a bias term, then passes the result through an activation function. " +
          "During training, the network adjusts those weights and biases to reduce " +
          "its prediction error.",
      },
      {
        type: "callout",
        variant: "math",
        title: "The formula",
        body: "output = activation( W · input + b )\n\nW  — weight matrix  (learned)\nb  — bias vector    (learned)\nactivation  — non-linear function (ReLU, Softmax, …)",
      },
      {
        type: "heading",
        level: 3,
        body: "Activation functions",
      },
      {
        type: "text",
        body:
          "Without an activation function, stacking Dense layers would be no more " +
          "powerful than a single linear transformation. Activations introduce " +
          "non-linearity, letting the network learn complex, real-world patterns.",
      },
      {
        type: "callout",
        variant: "info",
        title: "ReLU — best for hidden layers",
        body: "ReLU outputs max(0, x). It is fast to compute, avoids the vanishing-gradient problem, and is the go-to default for hidden Dense layers.",
      },
      {
        type: "callout",
        variant: "tip",
        title: "Softmax — best for the output layer",
        body: "Softmax converts a vector of raw scores into class probabilities that sum to 1. Use it as the activation on the final Dense layer of any multi-class classifier.",
      },
      {
        type: "heading",
        level: 3,
        body: "What we're building",
      },
      {
        type: "text",
        body:
          "We'll classify handwritten digits (0–9) from the MNIST dataset. Each " +
          "28×28-pixel image is flattened into a vector of 784 values — that is " +
          "why the Input block uses shape 784. Two Dense layers then map those " +
          "pixel values to one of 10 digit classes.",
      },
      {
        type: "code",
        language: "python",
        body:
          "# The architecture you will build\n" +
          "inputs = layers.Input(shape=(784,))\n" +
          "x      = layers.Dense(128, activation='relu')(inputs)\n" +
          "output = layers.Dense(10,  activation='softmax')(x)\n" +
          "model  = models.Model(inputs=inputs, outputs=output)",
      },
      {
        type: "divider",
      },
      {
        type: "callout",
        variant: "warning",
        title: "Ready to build?",
        body: "Switch to the Steps tab and follow each step on the canvas. The Input block is already placed — you just need to add and connect the Dense layers.",
      },
    ],

    steps: [
      {
        id: "has-input",
        title: "Start with the Input block",
        description:
          "We've placed an Input block for you. Its shape of 784 represents a flattened " +
          "28×28 grayscale image — the format used by the MNIST handwritten-digit dataset.",
        hint: "The Input block is already on your canvas — no action needed for this step.",
        validate: (blocks) =>
          blocks.some(
            (b) => b.type === "Input" && b.properties.shape === "784"
          ),
      },
      {
        id: "has-hidden-dense",
        title: "Add a hidden Dense layer",
        description:
          "Drag a Dense layer from the sidebar onto the canvas. Open its properties " +
          "(right-click → Edit Properties) and set units to 128 and activation to relu. " +
          "This hidden layer will learn intermediate features of the digit images.",
        hint:
          "Open the Layers category in the sidebar. After dropping the Dense block, " +
          "right-click it → Edit Properties. Set units: 128 and activation: relu.",
        validate: (blocks) =>
          blocks.some(
            (b) =>
              b.type === "Dense" &&
              Number(b.properties.units) === 128 &&
              b.properties.activation === "relu"
          ),
      },
      {
        id: "has-output-dense",
        title: "Add an output Dense layer",
        description:
          "Add a second Dense layer. Set units to 10 (one output per digit class, 0–9) " +
          "and activation to softmax. Softmax converts raw scores into probabilities that " +
          "sum to 1, making it ideal for multi-class classification.",
        hint:
          "Drag another Dense block from the sidebar. Right-click → Edit Properties and " +
          "set units: 10 and activation: softmax.",
        validate: (blocks) =>
          blocks.some(
            (b) =>
              b.type === "Dense" &&
              Number(b.properties.units) === 10 &&
              b.properties.activation === "softmax"
          ),
      },
      {
        id: "connected",
        title: "Wire the blocks together",
        description:
          "Connect the blocks in sequence: Input → Dense(128) → Dense(10). " +
          "Hover over the output port (right edge) of a block and drag to the input port " +
          "(left edge) of the next block to create a wire.",
        hint:
          "Small circles on each block's edges are ports. Drag from an output port " +
          "(right side, blue dot) to an input port (left side, blue dot). " +
          "Make sure Input feeds into Dense(128), which feeds into Dense(10).",
        validate: (blocks, connections) => {
          const inputBlock = blocks.find((b) => b.type === "Input");
          const hiddenDense = blocks.find(
            (b) => b.type === "Dense" && Number(b.properties.units) === 128
          );
          const outputDense = blocks.find(
            (b) => b.type === "Dense" && Number(b.properties.units) === 10
          );
          if (!inputBlock || !hiddenDense || !outputDense) return false;
          const conn1 = connections.some(
            (c) => c.fromBlockId === inputBlock.id  && c.toBlockId === hiddenDense.id
          );
          const conn2 = connections.some(
            (c) => c.fromBlockId === hiddenDense.id && c.toBlockId === outputDense.id
          );
          return conn1 && conn2;
        },
      },
    ],

    solution: {
      requiredBlocks: [
        { type: "Input", requiredProperties: { shape: "784" } },
        { type: "Dense", requiredProperties: { units: 128, activation: "relu" } },
        { type: "Dense", requiredProperties: { units: 10,  activation: "softmax" } },
      ],
      requiredConnectionSequence: [
        { fromType: "Input", toType: "Dense" },
        { fromType: "Dense", toType: "Dense" },
      ],
    },
  },

  // ─── Add more lessons here — only this file needs to change ─────────────────
];

export default LESSONS;

export const getLessonById = (id) => LESSONS.find((l) => l.id === id) || null;