export const enterFullscreen = async (): Promise<void> => {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;

  try {
    await document.documentElement.requestFullscreen();
  } catch {
    // Fullscreen can be blocked by browser permissions or an unavailable user gesture.
  }
};

export const exitFullscreen = async (): Promise<void> => {
  if (!document.fullscreenElement || !document.exitFullscreen) return;

  try {
    await document.exitFullscreen();
  } catch {
    // The browser may already have exited fullscreen.
  }
};
