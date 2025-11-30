import { Resend } from 'resend';
import { environment } from '@/environment';

const email = new Resend(environment.RESEND_API_KEY);

export { email };
