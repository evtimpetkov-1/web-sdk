import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

// Stake Engine currency formatting (https://stake-engine.com/docs/reference/currencies)
interface CurrencyInfo {
	symbol: string;
	decimals: number;
	symbolAfter?: boolean;
}

const CurrencyMeta: Record<string, CurrencyInfo> = {
	USD: { symbol: '$', decimals: 2 },
	CAD: { symbol: 'CA$', decimals: 2 },
	JPY: { symbol: '¥', decimals: 0 },
	EUR: { symbol: '€', decimals: 2 },
	RUB: { symbol: '₽', decimals: 2 },
	CNY: { symbol: 'CN¥', decimals: 2 },
	PHP: { symbol: '₱', decimals: 2 },
	INR: { symbol: '₹', decimals: 2 },
	IDR: { symbol: 'Rp', decimals: 0 },
	KRW: { symbol: '₩', decimals: 0 },
	BRL: { symbol: 'R$', decimals: 2 },
	MXN: { symbol: 'MX$', decimals: 2 },
	DKK: { symbol: 'KR', decimals: 2, symbolAfter: true },
	PLN: { symbol: 'zł', decimals: 2, symbolAfter: true },
	VND: { symbol: '₫', decimals: 0, symbolAfter: true },
	TRY: { symbol: '₺', decimals: 2 },
	CLP: { symbol: 'CLP', decimals: 0, symbolAfter: true },
	ARS: { symbol: 'ARS', decimals: 2, symbolAfter: true },
	PEN: { symbol: 'S/', decimals: 2 },
	NGN: { symbol: '₦', decimals: 2 },
	SAR: { symbol: 'SAR', decimals: 2, symbolAfter: true },
	ILS: { symbol: 'ILS', decimals: 2, symbolAfter: true },
	AED: { symbol: 'AED', decimals: 2, symbolAfter: true },
	TWD: { symbol: 'NT$', decimals: 2 },
	NOK: { symbol: 'kr', decimals: 2 },
	KWD: { symbol: 'KD', decimals: 2 },
	JOD: { symbol: 'JD', decimals: 2 },
	CRC: { symbol: '₡', decimals: 2 },
	TND: { symbol: 'TND', decimals: 2, symbolAfter: true },
	SGD: { symbol: 'SG$', decimals: 2 },
	MYR: { symbol: 'RM', decimals: 2 },
	OMR: { symbol: 'OMR', decimals: 2, symbolAfter: true },
	QAR: { symbol: 'QAR', decimals: 2, symbolAfter: true },
	BHD: { symbol: 'BD', decimals: 2 },
	PKR: { symbol: 'Rs', decimals: 2 },
	EGP: { symbol: 'م.ج', decimals: 2, symbolAfter: true },
	NZD: { symbol: 'NZ$', decimals: 2 },
	BOB: { symbol: 'Bs', decimals: 2 },
	GHS: { symbol: 'GH₵', decimals: 2 },
	KES: { symbol: 'KSh', decimals: 2 },
	MAD: { symbol: 'MAD', decimals: 2 },
	BAM: { symbol: 'KM', decimals: 2 },
	ISK: { symbol: 'kr', decimals: 2 },
	TZS: { symbol: 'TSh', decimals: 2 },
	UGX: { symbol: 'USh', decimals: 2 },
	XOF: { symbol: 'CFA', decimals: 2 },
	XGC: { symbol: 'GC', decimals: 2, symbolAfter: true },
	XSC: { symbol: 'SC', decimals: 2, symbolAfter: true },
	XEC: { symbol: 'SC', decimals: 2, symbolAfter: true },
};

// bookEventAmount: is the amount or win numbers in the events of books, e.g. the amount in setTotalWin bookEvent
// {
// 	"index": 3,
// 	"type": "setTotalWin",
// 	"amount": 100
// },
// if betting on $1,   100 bookEventAmount equals to $1.    betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $1,    50 bookEventAmount equals to $0.5.  betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5
// if betting on $0.5, 100 bookEventAmount equals to $0.5.  betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $0.5,  50 bookEventAmount equals to $0.25. betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5

export const bookEventAmountToBetAmountMultiplier = (bookEventAmount: number) =>
	bookEventAmount / BOOK_AMOUNT_MULTIPLIER;

export const bookEventAmountToNormalisedAmount = (bookEventAmount: number) => {
	const betAmountMultiplier = bookEventAmountToBetAmountMultiplier(bookEventAmount);
	return stateBet.wageredBetAmount * betAmountMultiplier;
};

export const numberToFloat = (value: number) => Number.parseFloat(`${value}`);

const getCurrencyMeta = (): CurrencyInfo =>
	CurrencyMeta[stateBet.currency] ?? {
		symbol: stateBet.currency,
		decimals: 2,
		symbolAfter: true,
	};

export const getCurrencyDecimals = () => getCurrencyMeta().decimals;

const withCurrencySymbol = (formatted: string) => {
	const meta = getCurrencyMeta();

	return meta.symbolAfter ? `${formatted} ${meta.symbol}` : `${meta.symbol}${formatted}`;
};

export const numberToCurrencyString = (value: number) =>
	withCurrencySymbol(numberToFloat(value).toFixed(getCurrencyDecimals()));

/**
 * RGS precision: every amount is an integer with six decimal places, so nothing
 * we derive from a book event is meaningful past 1e-6. Rounding there first is
 * what stops float noise (0.01 * 20.6 = 0.20600000000000002) from reading as a
 * value that needs more decimals than it actually has.
 */
const RGS_DECIMALS = 6;

/**
 * The ceiling on win precision. Stake's small-denomination rule asks for three
 * points when a game's minimum win is >= 0.1x and four when it is below that;
 * four covers both.
 */
const MAX_WIN_DECIMALS = 4;

/**
 * How many decimals a win needs at the CURRENT bet, from Stake's own yardstick:
 * a game's smallest win is a 0.1x, so a $0.01 bet pays down to $0.001 and needs
 * three points where a $0.10 bet pays whole cents and needs two.
 *
 * Deliberately derived from the bet and not from the value being formatted. The
 * count-up tween runs through arbitrary reals on its way to the total, so
 * per-value precision would have the box flickering between two, three and four
 * decimals mid-animation. The bet does not move during a round, so this does
 * not either — and it is what the platform recommends: extra precision shown
 * when the base bet is under $0.10, not when a particular number happens to
 * want it. The cost is a trailing zero on the round ones ($0.50 reads "$0.500"
 * at a $0.01 bet), which is exact and stable.
 */
const getWinDecimals = () => {
	const smallestWin = Number((numberToFloat(stateBet.betAmount) / 10).toFixed(RGS_DECIMALS));
	let decimals = getCurrencyDecimals();

	while (decimals < MAX_WIN_DECIMALS && Number(smallestWin.toFixed(decimals)) !== smallestWin) {
		decimals += 1;
	}

	return decimals;
};

/**
 * Wins must show EXACT amounts, which two decimals cannot do once the platform
 * hands out sub-$0.10 bet levels: payouts are multiples of 0.1x, so a $0.01 bet
 * pays in thousandths — a 0.2x line win is $0.002 and a 20.6x win is $0.206,
 * not $0.21. Two decimals rendered the small ones as $0.00, which Stake raised
 * against the shipped build.
 *
 * Balance and bet displays stay on `numberToCurrencyString` on purpose: the
 * rule covers wins only, and a bankroll never needs more than two points.
 */
export const numberToWinCurrencyString = (value: number) =>
	withCurrencySymbol(Number(numberToFloat(value).toFixed(RGS_DECIMALS)).toFixed(getWinDecimals()));

export const bookEventAmountToCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToCurrencyString(normalisedAmount);
};

export const bookEventAmountToWinCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToWinCurrencyString(normalisedAmount);
};
