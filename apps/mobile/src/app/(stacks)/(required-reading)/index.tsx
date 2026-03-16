import { Button } from '@/components/ui/button';
import { requiredReading } from '@/configs/consts/required-reading';
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
		<Button className='bg-primary h-fit rounded-sm py-2.5' onPress={navigate}>
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

function RequiredReadingScreen() {
	return (
		<View className='p-4 gap-y-3'>
			{Object.entries(requiredReading).map((requiredReading) => (
				<Item
					key={requiredReading[0]}
					title={requiredReading[1].title}
					href={`/(stacks)/(required-reading)/${requiredReading[0]}`}
				/>
			))}
		</View>
	);
}

export default RequiredReadingScreen;
