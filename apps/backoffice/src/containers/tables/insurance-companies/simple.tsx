'use client';

import { maskCNPJ } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { placeholder } from '@/config/placeholder';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/insurance-companies/use-insurance-companies';

function TableInsuranceCompaniesSimple() {
	const { data } = useInsuranceCompaniesSimple();

	return (
		<div className='grid xl:grid-cols-6 2xl:grid-cols-8 gap-4'>
			{data?.map(({ name, icon, cnpj }, index) => (
				<Card key={index.toString()} className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						<Image
							src={icon || placeholder.company}
							width={512}
							height={512}
							alt='Image do usuário'
							priority
							className='object-fill object-center xl:h-40 2xl:h-45'
						/>
						<div className='px-3 py-2 border-t'>
							<span className='block text-sm/tight font-medium capitalize line-clamp-2 truncate'>
								{capitalizeFirstLetters(name)}
							</span>
							<span className='block text-xs text-muted-foreground capitalize'>
								{maskCNPJ(cnpj)}
							</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

export { TableInsuranceCompaniesSimple };
