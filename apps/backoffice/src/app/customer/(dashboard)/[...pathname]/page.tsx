import { MessageCircleIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CONE from '@/public/images/cone.png';

export const metadata: Metadata = {
	title: 'Página em Contrução',
};

function Pathnames() {
	return (
		<main className='h-[calc(100dvh-15dvh)] flex flex-col items-center justify-between pt-20'>
			<div>
				<Image
					src={CONE}
					width={1280}
					height={1280}
					priority
					quality={100}
					alt='Cone'
					className='w-fit h-48 mx-auto'
				/>
				<div className='mt-10'>
					<span className='text-center text-4xl font-semibold block'>
						Página em Construção
					</span>
					<p className='text-center md:mx-80 mt-4 leading-tight'>
						O sistema está em desenvolvimento. Lançaremos mais atualizações em
						breve. Agradecemos a compreensão.
					</p>
				</div>
			</div>
			<Card className='w-full mt-10 md:mt-0'>
				<CardHeader>
					<CardTitle>Fale com o suporte ou redirecione</CardTitle>
				</CardHeader>
				<CardContent className='md:flex gap-x-4 -mt-4'>
					<Link href='/dashboard'>
						<Button variant='active' className='w-full md:w-fit'>
							Voltar para o Dashboard
						</Button>
					</Link>
					<Link href='https://wa.me/' target='_blank'>
						<Button variant='outline' className='w-full md:w-fit mt-2 md:mt-0'>
							<MessageCircleIcon /> Falar com o suporte
						</Button>
					</Link>
				</CardContent>
			</Card>
		</main>
	);
}

export default Pathnames;
