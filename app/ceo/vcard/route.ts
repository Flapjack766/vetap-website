import { NextResponse } from 'next/server';
import { ceoData } from '@/lib/ceo/data';

export async function GET() {
  const vcard = `BEGIN:VCARD
VERSION:3.0
N:Alzbaji;Ahmed;;;
FN:Ahmed Alzbaji
ORG:VETAP
TITLE:Founder & CEO
EMAIL;TYPE=INTERNET,PREF:${ceoData.emails[0]}
EMAIL;TYPE=INTERNET:${ceoData.emails[1]}
TEL;TYPE=CELL,VOICE,pref:${ceoData.phones[0]}
TEL;TYPE=CELL,VOICE:${ceoData.phones[1]}
URL:${ceoData.company.url}
X-SOCIALPROFILE;type=twitter:${ceoData.social.twitter.url}
X-SOCIALPROFILE;type=instagram:${ceoData.social.instagram.url}
X-SOCIALPROFILE;type=snapchat:${ceoData.social.snapchat.url}
NOTE:Founder and CEO of VETAP - Professional Website Design & Engineering
END:VCARD`;

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'attachment; filename="Ahmed-Alzbaji.vcf"',
    },
  });
}

