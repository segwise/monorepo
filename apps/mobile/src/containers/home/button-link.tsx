import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';
import Constants from 'expo-constants';
import { openURL } from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

const company = Constants.expoConfig?.extra?.company?.id;

type ButtonLinkVariant =
	| { href: Href; onPress?: never }
	| { href?: never; onPress: () => void };

type ButtonLinkProps = {
	title: string;
	invert?: boolean;
	icon?: SymbolViewProps['name'];
	secondary?: boolean;
} & ButtonLinkVariant;

function ButtonLink(props: ButtonLinkProps) {
	const { title, invert, icon, href, onPress: onClick, secondary } = props;

	const { push } = useRouter();

	function onPress() {
		if (onClick) {
			onClick();
		} else if (href) {
			const isUrl = z.url().safeParse(href.toString()).success;

			if (isUrl) {
				openURL(href.toString());

				return;
			}

			push(href);
		}
	}

	return (
		<TouchableOpacity
			onPress={onPress}
			className={cn(
				'rounded-sm border bg-background py-2 px-6 flex flex-row items-center justify-between',
				invert &&
					cn(
						'bg-primary border-primary',
						isCompany && 'bg-primary-xcar border-primary-xcar',
					),
			)}
		>
			<View className='size-6' />
			<Text
				allowFontScaling={false}
				className={cn(
					'text-lg font-semibold',
					invert && 'text-white',
					secondary &&
						cn('text-destructive font-bold', company && 'text-primary'),
				)}
			>
				{title}
			</Text>
			{icon ? (
				<SymbolView name={icon} tintColor='#FFFFFF' size={24} />
			) : (
				<View className='size-6' />
			)}
		</TouchableOpacity>
	);
}

export { ButtonLink };
