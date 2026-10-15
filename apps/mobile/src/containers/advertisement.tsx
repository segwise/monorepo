import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';

function Advertisement() {
	const { bottom } = useSafeAreaInsets();

	return (
		<View
			className={cn(
				'absolute left-0 right-0 bottom-0 bg-primary items-center justify-center',
				isCompany && 'bg-primary-xcar',
			)}
			style={{
				paddingBottom: bottom,
			}}
		>
			<View className='w-full h-[4.5rem] bg-gray-300 items-center justify-center'>
				<Text
					allowFontScaling={false}
					accessible={false}
					className='text-sm font-medium text-zinc-500'
				>
					Divulgação de Propaganda
				</Text>
			</View>
		</View>
	);
}

export { Advertisement };
