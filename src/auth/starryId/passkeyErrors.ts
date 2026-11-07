/** Predictable user-facing messages; cancellation never becomes a login failure. */
export function passkeyErrorMessage(error:unknown):string|null{
 const e=error as {name?:unknown;error?:unknown;code?:unknown;message?:unknown}|null;
 const name=typeof e?.name==='string'?e.name:'';
 const code=typeof e?.error==='string'?e.error:typeof e?.code==='string'?e.code:'';
 const message=typeof e?.message==='string'?e.message:'';
 if(name==='NotAllowedError'||name==='AbortError'||code==='UserCancelled'||code==='Aborted'||code==='PASSKEY_CANCELLED')return null;
 if(name==='InvalidStateError'||code==='CredentialAlreadyExists'||code==='PASSKEY_EXISTS')
  return '這支裝置已經有這把 Passkey，不需要重複新增。';
 if(code==='NoCredentials'||name==='NotFoundError')
  return '找不到可使用的 Passkey，請改用 Apple 或 Google 帳號登入。';
 if(code==='BadConfiguration'||/doesn't seem to be linked/i.test(message))
  return '手機 Passkey 尚未完成系統設定，請使用開發版 App，並確認管理員已登記裝置簽章。';
 // Current Starry ID Passkey registration works regardless of how long ago the member signed in.
 if(code==='NotSupported'||code==='PASSKEY_UNSUPPORTED'||/not supported/i.test(message))
  return '這個裝置不支援 Passkey，請改用 Apple 或 Google 登入。';
 return 'Passkey 暫時無法使用，請稍後重試，或改用 Apple／Google 登入。';
}
