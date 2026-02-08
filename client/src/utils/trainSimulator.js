export const simulateTraining = (totalEpochs, onEpoch, onComplete) => {
  let epoch = 0;
  const history = { loss: [], val_loss: [], accuracy: [], val_accuracy: [] };

  const baseLoss = 2.0 + Math.random() * 0.5;
  const minLoss = 0.05 + Math.random() * 0.1;
  const decayRate = 3.0 / totalEpochs;

  const timer = setInterval(() => {
    epoch++;
    const t = epoch / totalEpochs;

    // Exponential decay loss with noise
    const noise = () => (Math.random() - 0.5) * 0.08;
    const loss = Math.max(minLoss, baseLoss * Math.exp(-decayRate * epoch) + noise());
    const valLoss = Math.max(minLoss + 0.02, loss + 0.05 + Math.abs(noise()) * 0.5);

    // Sigmoid accuracy curve with noise
    const accuracy = Math.min(0.99, 1 / (1 + Math.exp(-10 * (t - 0.35))) + noise() * 0.3);
    const valAccuracy = Math.min(0.98, accuracy - 0.02 - Math.abs(noise()) * 0.1);

    history.loss.push(Math.max(0, loss));
    history.val_loss.push(Math.max(0, valLoss));
    history.accuracy.push(Math.max(0, Math.min(1, accuracy)));
    history.val_accuracy.push(Math.max(0, Math.min(1, valAccuracy)));

    onEpoch({
      epoch,
      totalEpochs,
      loss: history.loss[history.loss.length - 1],
      val_loss: history.val_loss[history.val_loss.length - 1],
      accuracy: history.accuracy[history.accuracy.length - 1],
      val_accuracy: history.val_accuracy[history.val_accuracy.length - 1],
      history: { ...history },
    });

    if (epoch >= totalEpochs) {
      clearInterval(timer);
      onComplete({
        history,
        summary: {
          finalLoss: history.loss[history.loss.length - 1].toFixed(4),
          finalAccuracy: (history.accuracy[history.accuracy.length - 1] * 100).toFixed(2) + "%",
          finalValLoss: history.val_loss[history.val_loss.length - 1].toFixed(4),
          finalValAccuracy: (history.val_accuracy[history.val_accuracy.length - 1] * 100).toFixed(2) + "%",
          totalEpochs,
        },
      });
    }
  }, 600);

  return () => clearInterval(timer);
};
