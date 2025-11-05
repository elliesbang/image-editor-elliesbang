import { cropTransparentImage } from "../shared/utils";
import { runRemoveBg } from "../background/worker";

export async function runRemoveBgAndCrop(image) {
  const removed = await runRemoveBg(image);
  return await cropTransparentImage(removed);
}
