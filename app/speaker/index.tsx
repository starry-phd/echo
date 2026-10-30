import {Redirect} from 'expo-router';

// The legacy Echo has no standalone speaker directory. Speaker names open
// the original profile overlay in context of an approved audio card instead.
export default function LegacySpeakerDirectoryRedirect(){
 return <Redirect href="/" />;
}
