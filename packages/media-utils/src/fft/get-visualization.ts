// Adapted from node-fft project by Joshua Wong and Ben Bryan
// https://github.com/vail-systems/node-fft

import {fft} from './fft';
import {fftMag} from './mag';
import {smoothen} from './smoothing';
import {toInt16} from './to-int-16';

export const getVisualization = ({
	sampleSize,
	data,
	sampleRate,
	frame,
	fps,
	maxInt,
}: {
	sampleSize: number;
	data: Float32Array;
	frame: number;
	sampleRate: number;
	fps: number;
	maxInt: number;
}): number[] => {
	const isPowerOfTwo = sampleSize > 0 && (sampleSize & (sampleSize - 1)) === 0;
	if (!isPowerOfTwo) {
		throw new TypeError(
			`The argument "bars" must be a power of two. For example: 64, 128. Got instead: ${sampleSize}`,
		);
	}

	if (!fps) {
		throw new TypeError('The argument "fps" was not provided');
	}

	if (data.length < sampleSize) {
		throw new TypeError(
			'Audio data is not big enough to provide ' + sampleSize + ' bars.',
		);
	}

	const start = Math.floor((frame / fps) * sampleRate);

	const actualStart = Math.max(0, start - sampleSize / 2);

	const ints = new Int16Array({
		length: sampleSize,
	});
	ints.set(
		data.subarray(actualStart, actualStart + sampleSize).map((x) => toInt16(x)),
	);
	const phasors = fft(ints);
	const magnitudes = fftMag(phasors).map((p) => p);

	return smoothen(magnitudes).map((m) => m / (sampleSize / 2) / maxInt);
};
