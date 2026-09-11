export function createMailer(config) {
 return async (email,purpose,token) => {
  if(!config.resendKey || !config.mailFrom) throw new Error('MAIL_NOT_CONFIGURED');
  // Fragments are not sent to web servers or referrers. Redemption requires an explicit POST.
  const link = `${config.origin}/#${purpose}=${token}`;
  const action=purpose==='verify'?'Verify your email':'Reset your password';
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',headers:{Authorization:`Bearer ${config.resendKey}`,'Content-Type':'application/json'},
   body:JSON.stringify({from:config.mailFrom,to:[email],subject:`${action} · LiiiGHTNOTES`,text:`${action}\n\nOpen this link in your browser:\n${link}\n\nThis link expires in ${purpose==='verify'?'24 hours':'30 minutes'} and can only be used once. If you did not request this, you can ignore this email.\n\nLiiiGHTNOTES`}),
   signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)throw new Error('MAIL_DELIVERY_FAILED');
 };
}
