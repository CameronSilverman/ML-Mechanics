/**
 * lessons.js — ML Maker Studio lesson registry
 *
 * To add a new lesson: push a new object to LESSONS. No other file needs changes.
 *
 * Lesson shape:
 * {
 *   id:                    string          — unique slug used in the URL
 *   title:                 string
 *   category:              string          — groups lessons on the Learn home page
 *   difficulty:            'beginner' | 'intermediate' | 'advanced'
 *   estimatedMinutes:      number
 *   description:           string          — shown on the lesson card
 *   objectives:            string[]        — bullet list shown in instruction panel
 *
 *   lockedTrainingSettings: object | null  — if set, TrainingSettingsPanel becomes read-only
 *     { optimizer, learningRate, loss, epochs, batchSize }
 *
 *   initialBlocks: Array<{               — blocks pre-placed when the lesson starts
 *     type:               string          — must match a type in mlComponents.js
 *     x:                  number
 *     y:                  number
 *     overrideProperties: object          — merged over the component's defaults
 *     lockedProperties:   string[]        — property keys that cannot be edited
 *   }>
 *
 *   steps: Array<{                        — shown in the instruction panel
 *     id:          string
 *     title:       string
 *     description: string
 *     hint:        string | null
 *     validate:    (blocks, connections) => boolean
 *   }>
 *
 *   solution: {                           — used by solutionChecker for the final pass/fail
 *     requiredBlocks: Array<{
 *       type:               string
 *       requiredProperties: object        — loose (==) property matching
 *     }>
 *     requiredConnectionSequence: Array<{ fromType, toType }> | null
 *   }
 * }
 */

const LESSONS = [
  // ─── Fundamentals ────────────────────────────────────────────────────────────
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

    // The Input block is pre-placed; its shape is locked so the lesson stays coherent
    initialBlocks: [
      {
        type: "Input",
        x: 80,
        y: 200,
        overrideProperties: { shape: "784" },
        lockedProperties: ["shape"],
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
            (b) =>
              b.type === "Dense" && Number(b.properties.units) === 128
          );
          const outputDense = blocks.find(
            (b) =>
              b.type === "Dense" && Number(b.properties.units) === 10
          );
          if (!inputBlock || !hiddenDense || !outputDense) return false;
          const conn1 = connections.some(
            (c) =>
              c.fromBlockId === inputBlock.id &&
              c.toBlockId === hiddenDense.id
          );
          const conn2 = connections.some(
            (c) =>
              c.fromBlockId === hiddenDense.id &&
              c.toBlockId === outputDense.id
          );
          return conn1 && conn2;
        },
      },
    ],

    solution: {
      requiredBlocks: [
        { type: "Input",  requiredProperties: { shape: "784" } },
        { type: "Dense",  requiredProperties: { units: 128, activation: "relu" } },
        { type: "Dense",  requiredProperties: { units: 10,  activation: "softmax" } },
      ],
      requiredConnectionSequence: [
        { fromType: "Input", toType: "Dense" },
        { fromType: "Dense", toType: "Dense" },
      ],
    },
  },

  // ─── Add more lessons here — no other files need to change ───────────────────
];

export default LESSONS;

export const getLessonById = (id) => LESSONS.find((l) => l.id === id) || null;