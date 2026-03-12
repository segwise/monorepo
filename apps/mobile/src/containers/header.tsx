import LOGO from '@/assets/images/logo/segwise.png';
import XCAR from '@/assets/images/logo/xcar-light-full.png';
import { cn } from '@/libraries/classname';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps extends NativeStackHeaderProps {
	titlePosition?: 'left' | 'center' | 'right';
	showReturn?: boolean;
}

function Header({
	titlePosition = 'center',
	showReturn = true,
	options: { title },
}: HeaderProps) {
	const { width } = useWindowDimensions();
	const { top } = useSafeAreaInsets();

	const { back } = useRouter();

	return (
		<View>
			<View className='bg-primary' style={{ height: top }} />
			<View
				className={cn(
					'bg-primary flex-row items-center justify-center py-2 px-4',
					showReturn && 'justify-between',
				)}
			>
				{showReturn && (
					<TouchableOpacity
						onPress={back}
						hitSlop={14}
						className={cn('size-6', width <= 400 && 'size-8')}
					>
						<SymbolView
							name={{
								ios: 'chevron.left',
								android: 'chevron_left',
							}}
							size={width <= 400 ? 32 : 24}
							tintColor='#FFFFFF'
						/>
					</TouchableOpacity>
				)}
				<Image
					source={LOGO}
					style={{
						width: 170,
						height: 50,
					}}
					contentFit='contain'
					alt='Logo'
					cachePolicy='memory-disk'
					contentPosition='center'
					priority='high'
					placeholderContentFit='contain'
					allowDownscaling={false}
					accessible={false}
				/>
				{showReturn && (
					<View className={cn('size-6', width <= 400 && 'size-8')} />
				)}
			</View>
			<View
				className={cn(
					'bg-primary py-2 border-t border-t-white px-4 flex flex-row items-center justify-between',
					showReturn && 'justify-center',
				)}
			>
				<Text
					allowFontScaling={false}
					className={cn(
						'text-lg font-semibold text-white uppercase',
						titlePosition === 'left' && 'text-left',
						titlePosition === 'center' && 'text-center',
						titlePosition === 'right' && 'text-right',
					)}
				>
					{title}
				</Text>
				{!showReturn && (
					<View className='flex flex-row items-center justify-end gap-x-2'>
						<Text
							allowFontScaling={false}
							className='text-white font-medium text-xs'
						>
							Operado por:
						</Text>
						<Image
							source={XCAR}
							cachePolicy='memory-disk'
							priority='high'
							contentFit='contain'
							style={{
								width: 80,
								height: 25,
							}}
							allowDownscaling={false}
							accessible={false}
						/>
					</View>
				)}
			</View>
		</View>
	);
}

export { Header };
