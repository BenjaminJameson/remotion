import React, {
	forwardRef,
	MutableRefObject,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	CompositionManagerContext,
	CompProps,
	Internals,
	SetTimelineContextValue,
	TimelineContextValue,
} from 'remotion';
import {PlayerEventEmitterContext} from './emitter-context';
import {PlayerEmitter} from './event-emitter';
import {PLAYER_CSS_CLASSNAME} from './player-css-classname';
import {PlayerRef} from './player-methods';
import PlayerUI from './PlayerUI';

type PropsIfHasProps<Props> = {} extends Props
	? {
			props?: Props;
	  }
	: {
			props: Props;
	  };

export type PlayerProps<T> = {
	durationInFrames: number;
	width: number;
	height: number;
	fps: number;
	controls?: boolean;
	style?: Omit<React.CSSProperties, 'height' | 'width'>;
	loop?: boolean;
	autoPlay?: boolean;
} & PropsIfHasProps<T> &
	CompProps<T>;

Internals.CSSUtils.injectCSS(
	Internals.CSSUtils.makeDefaultCSS(`.${PLAYER_CSS_CLASSNAME}`)
);

export const PlayerFn = <T,>(
	{
		durationInFrames,
		height,
		width,
		fps,
		props,
		controls,
		style,
		loop,
		autoPlay,
		...componentProps
	}: PlayerProps<T>,
	ref: MutableRefObject<PlayerRef>
) => {
	const component = Internals.useLazyComponent(componentProps);
	const [frame, setFrame] = useState(0);
	const [playing, setPlaying] = useState<boolean>(false);
	const [rootId] = useState<string>('player-comp');
	const [emitter] = useState(() => new PlayerEmitter());
	const rootRef = useRef<PlayerRef>(null);

	useImperativeHandle(ref, () => rootRef.current as PlayerRef);

	const timelineContextValue = useMemo((): TimelineContextValue & {
		shouldRegisterSequences: boolean;
	} => {
		return {
			frame,
			playing,
			rootId,
			shouldRegisterSequences: false,
		};
	}, [frame, playing, rootId]);

	const setTimelineContextValue = useMemo((): SetTimelineContextValue => {
		return {
			setFrame,
			setPlaying,
		};
	}, [setFrame]);
	const compositionManagerContext: CompositionManagerContext = useMemo(() => {
		return {
			compositions: [
				{
					component,
					durationInFrames,
					height,
					width,
					fps,
					id: 'player-comp',
					props,
					nonce: 777,
				},
			],
			currentComposition: 'player-comp',
			registerComposition: () => undefined,
			registerSequence: () => undefined,
			sequences: [],
			setCurrentComposition: () => undefined,
			unregisterComposition: () => undefined,
			unregisterSequence: () => undefined,
			registerAsset: () => undefined,
			unregisterAsset: () => undefined,
			assets: [],
		};
	}, [component, props, durationInFrames, fps, height, width]);

	return (
		<Internals.Timeline.TimelineContext.Provider value={timelineContextValue}>
			<Internals.Timeline.SetTimelineContext.Provider
				value={setTimelineContextValue}
			>
				<Internals.CompositionManager.Provider
					value={compositionManagerContext}
				>
					<PlayerEventEmitterContext.Provider value={emitter}>
						<PlayerUI
							ref={rootRef}
							autoPlay={Boolean(autoPlay)}
							loop={Boolean(loop)}
							controls={Boolean(controls)}
							style={style}
						/>
					</PlayerEventEmitterContext.Provider>
				</Internals.CompositionManager.Provider>
			</Internals.Timeline.SetTimelineContext.Provider>
		</Internals.Timeline.TimelineContext.Provider>
	);
};

declare module 'react' {
	// eslint-disable-next-line @typescript-eslint/no-shadow
	function forwardRef<T, P = {}>(
		render: (
			props: P,
			ref: React.MutableRefObject<T>
		) => React.ReactElement | null
	): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}

export const Player = forwardRef(PlayerFn);
