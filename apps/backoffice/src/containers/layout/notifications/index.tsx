import { BellIcon, BellOffIcon, XCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';

function SheetNotification() {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					variant='ghost'
					className='size-8 relative bg-muted rounded-full overflow-hidden flex items-center justify-center p-0'
				>
					<BellIcon />
					{/* <div className='size-3 rounded-full absolute top-1 right-1.5 bg-destructive text-xs text-[0.60rem] text-white flex flex-row items-center justify-center'>
						1
					</div> */}
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Centro de notificações</SheetTitle>
					<SheetDescription>Atualização de notificações</SheetDescription>
				</SheetHeader>
				<Separator />
				<div>
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant='icon' className='rounded-full'>
								<BellOffIcon />
							</EmptyMedia>
							<EmptyTitle>Nenhuma notificação encontrada!</EmptyTitle>
							<EmptyDescription>
								Você não tem nenhuma notificação registrada no momento
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</div>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant='destructive'>
							Fechar <XCircleIcon />
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

export { SheetNotification };
