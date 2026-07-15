import type z from 'zod';
import type { SchemaPaymentSimple } from '../../schemas/payments';

type PaymentSimple = z.infer<typeof SchemaPaymentSimple>;

export type { PaymentSimple };
