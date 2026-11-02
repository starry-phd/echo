import type {EchoTrack} from '../types';

/**
 * Native (iOS/Android) audio session for verified public playback only.
 *
 * The legacy Web app used `playsinline` + Media Session (`src/mediaSessionPolicy.ts`
 * in yukidu/Echo-Starry@82cbf4f): title, speaker as artist, album 繁星回聲,
 * speaker portrait (else the 512px app icon) and play/pause/seek controls on the
 * lock screen. The native equivalent is configured here.
 *
 * This is configuration, not an access grant: it is applied only after the user
 * presses play on a track the public detail endpoint marked `playable`.
 */
export const ECHO_APP_TITLE='繁星回聲';
export const NATIVE_AUDIO_MODE={
 playsInSilentMode:true,
 shouldPlayInBackground:true,
 interruptionMode:'doNotMix'
} as const;
export const NATIVE_LOCK_SCREEN_OPTIONS={showSeekBackward:true,showSeekForward:true} as const;
export const LEGACY_DEFAULT_ARTWORK_PATH='/icon-512.png';

export type NativeLockScreenMetadata={title:string;artist?:string;albumTitle:string;artworkUrl?:string};

/** Same-origin relative path only; never protocol-relative or absolute foreign URLs. */
function sameOriginPath(path:unknown):path is string{
 return typeof path==='string'&&path.startsWith('/')&&!path.startsWith('//');
}
export function nativeLockScreenMetadata(
 track:Pick<EchoTrack,'title'|'speaker'|'coverUrl'>,origin:string|null
):NativeLockScreenMetadata{
 const title=(track.title??'').trim()||ECHO_APP_TITLE;
 const artist=(track.speaker??'').trim();
 const artworkPath=sameOriginPath(track.coverUrl)?track.coverUrl:LEGACY_DEFAULT_ARTWORK_PATH;
 return {
  title,
  ...(artist?{artist}:{}),
  albumTitle:ECHO_APP_TITLE,
  ...(origin?{artworkUrl:origin+artworkPath}:{})
 };
}
