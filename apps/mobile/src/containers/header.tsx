import LOGO from '@/assets/images/logo/segwise.png';
import LOGO_XCAR from '@/assets/images/logo/xcar-light-full.png';
import { cn } from '@/libraries/classname';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
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

// @ts-expect-error
const isCompany = Constants.expoConfig?.extra.company;

interface HeaderProps extends NativeStackHeaderProps {
	titlePosition?: 'left' | 'center' | 'right';
	showReturn?: boolean;
	returnCallback?: () => void;
}

function Header({
	titlePosition = 'center',
	showReturn = true,
	options: { title },
	returnCallback,
	...props
}: HeaderProps) {
	const { width } = useWindowDimensions();
	const { top } = useSafeAreaInsets();

	// @ts-expect-error
	const firstInit = props.route?.params?.['first-init'];

	const { back } = useRouter();

	return (
		<View>
			<View
				className={cn('bg-primary', isCompany && 'bg-primary-xcar')}
				style={{ height: top }}
			/>
			<View
				className={cn(
					cn(
						'bg-primary flex-row items-center justify-center py-2 px-4',
						isCompany && 'bg-primary-xcar',
					),
					showReturn && 'justify-between',
				)}
			>
				{props.route?.name === 'request-referral' ? (
					<View className={cn('size-6', width <= 400 && 'size-8')} />
				) : !firstInit && showReturn ? (
					<TouchableOpacity
						onPress={() => {
							if (returnCallback) {
								return returnCallback();
							}

							back();
						}}
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
				) : (
					showReturn && (
						<View className={cn('size-6', width <= 400 && 'size-8')} />
					)
				)}
				<Image
					source={isCompany ? LOGO_XCAR : LOGO}
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
					cn(
						'bg-primary py-2 border-t border-t-white px-4 flex flex-row items-center justify-between',
						isCompany && 'bg-primary-xcar',
					),
					showReturn && 'justify-center',
				)}
			>
				<Text
					allowFontScaling={false}
					className={cn(
						'text-lg font-semibold text-white uppercase line-clamp-1',
						titlePosition === 'left' && 'text-left',
						titlePosition === 'center' && 'text-center',
						titlePosition === 'right' && 'text-right',
					)}
				>
					{title}
				</Text>
			</View>
		</View>
	);
}

export { Header };
