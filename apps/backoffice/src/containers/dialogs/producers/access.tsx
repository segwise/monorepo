'use client';

import {
	CheckIcon,
	CopyIcon,
	EyeIcon,
	EyeOffIcon,
	MessageCircleIcon,
	ShieldAlertIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { buildAccessMessage } from '@/functions/producers/build-access-message';

async function copyText(text: string, success: string) {
	try {
		await navigator.clipboard.writeText(text);

		toast.success(success);
	} catch {
		toast.error('FALHA AO COPIAR');
	}
}

// Tela de confirmação do cadastro de parceiro. É o ÚNICO lugar onde a senha
// aparece: ela vem do estado do formulário (nunca do servidor, que só guarda o
// hash), não é gravada em storage nem na URL e some quando o dialog fecha.
function ProducerAccessCredentials({
	name,
	email,
	password,
	accessUrl,
	passwordApplied,
	onDone,
}: {
	name: string;
	email: string;
	password: string;
	accessUrl: string;
	passwordApplied: boolean;
	onDone: () => void;
}) {
	const [showPassword, setShowPassword] = useState<boolean>(true);
	const [copied, setCopied] = useState<boolean>(false);

	async function copyWhatsApp() {
		await copyText(
			buildAccessMessage({
				name,
				email,
				password: passwordApplied ? password : null,
				accessUrl,
			}),
			'TEXTO COPIADO! COLE NO WHATSAPP',
		);

		setCopied(true);
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>Parceiro cadastrado</DialogTitle>
				<DialogDescription>
					O acesso já está liberado: envie o login e a senha ao parceiro. Não há
					e-mail de confirmação.
				</DialogDescription>
			</DialogHeader>
			<Separator />
			<div className='space-y-3 rounded-md border bg-muted/40 p-4'>
				<div className='flex flex-row items-center justify-between gap-x-3'>
					<div className='min-w-0'>
						<span className='block text-xs font-medium text-muted-foreground'>
							Login
						</span>
						<span className='block truncate font-semibold' data-testid='login'>
							{email}
						</span>
					</div>
					<Button
						type='button'
						variant='outline'
						size='icon'
						aria-label='Copiar login'
						onClick={() => copyText(email, 'LOGIN COPIADO')}
					>
						<CopyIcon />
					</Button>
				</div>
				<Separator />
				{passwordApplied ? (
					<div className='flex flex-row items-center justify-between gap-x-3'>
						<div className='min-w-0'>
							<span className='block text-xs font-medium text-muted-foreground'>
								Senha
							</span>
							<span
								className='block truncate font-mono font-semibold'
								data-testid='password'
							>
								{showPassword ? password : '•'.repeat(password.length)}
							</span>
						</div>
						<div className='flex flex-row items-center gap-x-1.5'>
							<Button
								type='button'
								variant='outline'
								size='icon'
								aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
								onClick={() => setShowPassword((value) => !value)}
							>
								{showPassword ? <EyeOffIcon /> : <EyeIcon />}
							</Button>
							<Button
								type='button'
								variant='outline'
								size='icon'
								aria-label='Copiar senha'
								onClick={() => copyText(password, 'SENHA COPIADA')}
							>
								<CopyIcon />
							</Button>
						</div>
					</div>
				) : (
					<div className='text-sm text-muted-foreground'>
						Este e-mail já tinha cadastro na Segwise: a senha dele{' '}
						<b className='text-foreground'>não foi alterada</b>. Ele entra com a
						senha que já usa.
					</div>
				)}
				<Separator />
				<div className='min-w-0'>
					<span className='block text-xs font-medium text-muted-foreground'>
						Link de acesso
					</span>
					<span className='block truncate text-sm'>{accessUrl}</span>
				</div>
			</div>
			<Button type='button' onClick={copyWhatsApp} className='w-full'>
				{copied ? <CheckIcon /> : <MessageCircleIcon />} Copiar para WhatsApp
			</Button>
			{passwordApplied && (
				<div className='flex flex-row items-start gap-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive'>
					<ShieldAlertIcon className='size-4 shrink-0' />
					<span>
						Por segurança, a senha só aparece nesta tela: não é guardada nem
						enviada por e-mail. Copie e envie agora — depois de fechar, ela não
						poderá ser vista de novo (o parceiro ainda pode usar "Esqueci minha
						senha").
					</span>
				</div>
			)}
			<Separator />
			<DialogFooter>
				<Button type='button' onClick={onDone}>
					Concluir
				</Button>
			</DialogFooter>
		</>
	);
}

export { ProducerAccessCredentials };
