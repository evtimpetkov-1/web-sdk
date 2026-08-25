import { createEnhanceBoardPreSpin } from './createEnhanceBoardPreSpin';
import { createEnhanceBoardSpin } from './createEnhanceBoardSpin';
import type { Reel, GetRawSymbolFromReel } from './types';

export function createEnhanceBoard() {
	function enhanceBoard<TReel extends Reel<any, any>>({ board }: { board: TReel[] }) {
		type TRawSymbol = GetRawSymbolFromReel<TReel>;

		const { preSpin } = createEnhanceBoardPreSpin({ board });
		const { spin, notifyStop } = createEnhanceBoardSpin({ board });
		const settle = (rawBoard?: TRawSymbol[][]) =>
			board.forEach((reel, reelIndex) => {
				const rawSymbols = rawBoard?.[reelIndex] || [];
				reel.setSymbolsWithRawSymbols(rawSymbols);
			});
		const stop = () => {
			// tells spin() to drop the staggered start, so a reel that has not
			// begun yet reacts to the stop button straight away
			notifyStop();
			board.forEach((reel) => reel.stop());
		};
		const readyToSpinEffect = () => {
			board.forEach((reel) => reel.readyToSpinEffect());
		};

		return {
			board,
			preSpin,
			spin,
			settle,
			stop,
			readyToSpinEffect,
		};
	}

	return { enhanceBoard };
}
