/** iOS/Android development-build adapter. Expo Go cannot load native WebAuthn. */
import {Passkey} from 'react-native-passkey';
import type {PasskeyCreateRequest,PasskeyGetRequest} from 'react-native-passkey';
import {validateCreationOptions,validateLoginOptions,verifyAssertion,verifyAttestation} from './passkeyContract';
import type {CredentialAssertion,CredentialAttestation,LoginOptions} from './passkeyContract';

export function passkeySupported():boolean{
 try{return Passkey.isSupported();}catch{return false;}
}
export async function getPlatformPasskey(options:LoginOptions):Promise<CredentialAssertion>{
 const publicKey=validateLoginOptions(options);
 if(!passkeySupported())throw new Error('Passkey not supported');
 const result=await Passkey.get(publicKey as PasskeyGetRequest);
 return verifyAssertion({id:result.id,clientDataJSON:result.response.clientDataJSON,
  authenticatorData:result.response.authenticatorData,signature:result.response.signature});
}
export async function createPlatformPasskey(raw:Record<string,unknown>):Promise<CredentialAttestation>{
 const publicKey=validateCreationOptions(raw);
 if(!passkeySupported())throw new Error('Passkey not supported');
 const result=await Passkey.create(publicKey as unknown as PasskeyCreateRequest);
 return verifyAttestation({clientDataJSON:result.response.clientDataJSON,
  attestationObject:result.response.attestationObject});
}
