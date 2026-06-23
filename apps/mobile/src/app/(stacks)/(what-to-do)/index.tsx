import { Button } from '@/components/ui/button';
import { isCompany } from '@/configs/consts/company';
import { whatToDo } from '@/configs/consts/what-to-do';
import { cn } from '@/libraries/classname';
import { type Href, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

interface ItemProps {
	title: string;
	href: Href;
}

function Item({ title, href }: ItemProps) {
	const { push } = useRouter();

	function navigate() {
		push(href);
	}

	return (
		<Button
			className={cn(
				'bg-primary h-fit rounded-sm py-2.5',
				isCompany && 'bg-primary-xcar',
			)}
			onPress={navigate}
		>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base text-white px-3 uppercase font-semibold text-center line-clamp-1'
			>
				{title}
			</Text>
		</Button>
	);
}

function WhatToDoScreen() {
	return (
		<View className='p-4 gap-y-3'>
			{Object.entries(whatToDo).map((whatToDo) => (
				<Item
					key={whatToDo[0]}
					title={whatToDo[1].title}
					href={`/(stacks)/(what-to-do)/${whatToDo[0]}`}
				/>
			))}
		</View>
	);
}

export default WhatToDoScreen;
