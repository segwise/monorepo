'use client';

import { MessageCircleIcon, ShieldIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const categories = [
	{
		id: 'sinistro',
		icon: '🛡️',
		label: 'Abrir Sinistro',
		description: 'Acidente, roubo ou dano',
	},
	{
		id: 'apolice',
		icon: '📄',
		label: 'Minha Apólice',
		description: 'Dúvidas sobre cobertura',
	},
	{
		id: 'boleto',
		icon: '💳',
		label: 'Pagamentos',
		description: 'Boleto, parcelas e renovação',
	},
	{
		id: 'novo',
		icon: '✨',
		label: 'Contratar Seguro',
		description: 'Quero fazer uma cotação',
	},
	{
		id: 'outro',
		icon: '💬',
		label: 'Outros Assuntos',
		description: 'Fale com nossa equipe',
	},
];

const faqs = [
	{
		q: 'Como acesso minha apólice digital?',
		a: 'Você pode acessar sua apólice pelo portal do cliente ou solicitar o envio por e-mail entrando em contato conosco. Basta ter o número da apólice ou o CPF do titular em mãos.',
	},
	{
		q: 'Qual o prazo para análise de sinistro?',
		a: 'O prazo legal para resposta inicial é de 10 dias úteis. Na maioria dos casos, concluímos a análise em 3 a 5 dias úteis. Você será notificado por e-mail e SMS a cada atualização.',
	},
	{
		q: 'Posso incluir um segundo motorista no seguro auto?',
		a: 'Sim. A inclusão de segundo condutor pode alterar o valor do prêmio dependendo do perfil. Entre em contato conosco para simularmos o impacto antes de efetivar a alteração.',
	},
	{
		q: 'O que fazer em caso de acidente?',
		a: 'Em emergências, ligue para nossa central 24h: 0800 000 0000. Documente o local com fotos, colete dados da outra parte e abra o sinistro pelo formulário acima ou pelo aplicativo.',
	},
	{
		q: 'Posso cancelar meu seguro a qualquer momento?',
		a: 'Sim. O cancelamento é possível a qualquer momento. Para seguros com menos de 7 dias, você tem direito a cancelamento sem custo. Após esse prazo, aplicamos o cálculo pro-rata do prêmio já consumido.',
	},
];

function SuportePage() {
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const [sent, setSent] = useState(false);
	const [formData, setFormData] = useState<{
		name: string;
		email: string;
		phone: string;
	}>({ name: '', email: '', phone: '' });

	function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault();

		setSent(true);
	}

	return (
		<div className='bg-background font-sans text-primary overflow-scroll! h-screen'>
			<header className='bg-primary text-white'>
				<div className='max-w-6xl mx-auto px-6 py-5 flex items-center justify-between'>
					<div className='flex items-center gap-3 w-1/2 lg:w-fit'>
						<span className='font-bold text-lg tracking-tight'>
							XCAR Corretora de Seguros <sup>( Segwise )</sup>
						</span>
					</div>
					<Link
						href='https://wa.me/8132291728'
						className='text-sm bg-active font-semibold text-white px-4 py-2 rounded-sm flex flex-row items-center justify-start gap-x-1'
					>
						<MessageCircleIcon className='size-4' />
						(81) 3229-1728
					</Link>
				</div>
			</header>
			<section className='bg-primary text-white pb-20 pt-14'>
				<div className='max-w-6xl mx-auto px-6 text-center'>
					<p className='text-active text-sm font-semibold tracking-widest uppercase mb-3'>
						Central de Atendimento
					</p>
					<h1 className='text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight'>
						Como podemos
						<br />
						<span className='text-active'>ajudar você hoje?</span>
					</h1>
					<p className='text-white text-lg max-w-xl mx-auto'>
						Selecione o assunto abaixo para um atendimento mais ágil. Nossa
						equipe responde em até 4 horas em dias úteis.
					</p>
				</div>
			</section>
			<div className='max-w-6xl mx-auto px-6 -mt-10 relative z-10'>
				<div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
					{categories.map((cat) => (
						<button
							key={cat.id}
							type='button'
							className='rounded-lg p-4 text-left transition-all border bg-white'
						>
							<span className='text-2xl block mb-2'>{cat.icon}</span>
							<span className='text-sm font-bold text-primary block leading-tight'>
								{cat.label}
							</span>
							<span className='text-xs text-primary/50 mt-0.5 block'>
								{cat.description}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className='max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8'>
				<div className='lg:col-span-2'>
					<div className='bg-white rounded-lg p-8 border'>
						<div className='flex items-center gap-3 mb-6'>
							<span className='text-2xl'>
								<ShieldIcon />
							</span>
							<div>
								<h2 className='text-xl font-black text-primary'>
									Qual é sua dúvida?
								</h2>
								<p className='text-sm text-primary/50'>
									Tire todas suas dúvidas com o nosso suporte
								</p>
							</div>
						</div>
						{sent ? (
							<div className='text-center py-12'>
								<div className='w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl'>
									✅
								</div>
								<h3 className='text-xl font-bold text-primary mb-2'>
									Mensagem enviada!
								</h3>
								<p className='text-primary/60 mb-6 max-w-sm mx-auto'>
									Nossa equipe retornará em até 4 horas. Você receberá um e-mail
									de confirmação em breve.
								</p>
								<button
									type='button'
									onClick={() => setSent(false)}
									className='text-active font-semibold text-sm hover:underline cursor-pointer'
								>
									Enviar outra mensagem
								</button>
							</div>
						) : (
							<form onSubmit={handleSubmit} className='space-y-5'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label
											htmlFor='name'
											className='block text-sm font-semibold text-primary mb-1.5'
										>
											Seu nome <span className='text-active'>*</span>
										</label>
										<input
											id='name'
											required
											type='text'
											value={formData.name}
											onChange={(e) =>
												setFormData({ ...formData, name: e.target.value })
											}
											placeholder='Nome completo'
											className='w-full border border-primary/15 rounded-md px-4 py-3 text-sm text-primary placeholder-primary/30 focus:outline-none focus:ring-2 focus:ring-active focus:border-transparent transition-all'
										/>
									</div>
									<div>
										<label
											htmlFor='email'
											className='block text-sm font-semibold text-primary mb-1.5'
										>
											E-mail <span className='text-active'>*</span>
										</label>
										<input
											required
											id='email'
											type='email'
											value={formData.email}
											onChange={(e) =>
												setFormData({ ...formData, email: e.target.value })
											}
											placeholder='seu@email.com'
											className='w-full border border-primary/15 rounded-lg px-4 py-3 text-sm text-primary placeholder-primary/30 focus:outline-none focus:ring-2 focus:ring-active focus:border-transparent transition-all'
										/>
									</div>
								</div>
								<div>
									<label
										htmlFor='phone'
										className='block text-sm font-semibold text-primary mb-1.5'
									>
										Telefone / WhatsApp
									</label>
									<input
										id='phone'
										type='tel'
										value={formData.phone}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
										placeholder='(00) 00000-0000'
										className='w-full border border-primary/15 rounded-lg px-4 py-3 text-sm text-primary placeholder-primary/30 focus:outline-none focus:ring-2 focus:ring-active focus:border-transparent transition-all'
									/>
								</div>
								<button
									type='submit'
									className='w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-foreground transition-colors text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer'
								>
									<span>Enviar mensagem</span>
									<span>→</span>
								</button>
								<p className='text-xs text-center text-primary/40'>
									Seus dados são protegidos conforme a LGPD. Não compartilhamos
									suas informações com terceiros.
								</p>
							</form>
						)}
					</div>
				</div>
				<div className='space-y-4'>
					<div className='bg-primary text-white rounded-lg p-6'>
						<p className='text-xs text-active font-semibold tracking-widest uppercase mb-3'>
							Emergência 24h
						</p>
						<p className='text-2xl font-black mb-1'>(81) 3229-1728</p>
						<p className='text-white/50 text-sm mb-4'>
							Ligação gratuita, inclusive de celular
						</p>
						<Link
							href='https://wa.me/8132291728'
							className='block w-full bg-active text-primary text-center font-bold py-3 rounded-md text-sm hover:bg-white transition-colors'
						>
							Ligar agora
						</Link>
					</div>
					<div className='bg-white rounded-lg p-6 border'>
						<div className='flex items-center gap-3 mb-3'>
							<div className='w-10 h-10 bg-primary/5 rounded-md flex items-center justify-center text-xl'>
								💬
							</div>
							<div>
								<p className='font-bold text-sm'>WhatsApp</p>
								<p className='text-xs text-primary/50'>Seg–Sex, 8h–18h</p>
							</div>
						</div>
						<Link
							href='https://wa.me/5581900000000'
							target='_blank'
							rel='noopener noreferrer'
							className='block w-full bg-[#25D366] text-white text-center font-bold py-3 rounded-md text-sm hover:bg-[#1ebe5a] transition-colors'
						>
							Abrir conversa
						</Link>
					</div>
					<div className='bg-white rounded-lg p-6 border'>
						<div className='flex items-center gap-3 mb-3'>
							<div className='w-10 h-10 bg-primary/5 rounded-md flex items-center justify-center text-xl'>
								✉️
							</div>
							<div>
								<p className='font-bold text-sm'>E-mail</p>
								<p className='text-xs text-primary/50'>Resposta em até 4h</p>
							</div>
						</div>
						<Link
							href='mailto:contato@xcarcorretora.com.br'
							className='block text-primary hover:text-active text-sm font-semibold truncate hover:underline'
						>
							contato@xcarcorretora.com.br
						</Link>
					</div>
					<div className='bg-white rounded-lg p-6 border'>
						<div className='flex items-center gap-3 mb-3'>
							<div className='w-10 h-10 bg-primary/5 rounded-md flex items-center justify-center text-xl'>
								📍
							</div>
							<div>
								<p className='font-bold text-sm'>Escritório</p>
								<p className='text-xs text-primary/50'>Seg–Sex, 8h–17h</p>
							</div>
						</div>
						<p className='text-sm text-primary/70 leading-relaxed'>
							Rua Arsenio Calaca, 115 - San Martin
							<br />
							Recife – PE, 50761-060
						</p>
					</div>
				</div>
			</div>
			<section className='max-w-6xl mx-auto px-6 pb-16'>
				<div className='mb-8'>
					<p className='text-active text-sm font-semibold tracking-widest uppercase mb-2'>
						FAQ
					</p>
					<h2 className='text-3xl font-black text-primary'>
						Perguntas frequentes
					</h2>
				</div>
				<div className='space-y-3'>
					{faqs.map((faq, i) => (
						<div
							key={i.toString()}
							className='bg-white rounded-lg border overflow-hidden'
						>
							<button
								type='button'
								onClick={() => setOpenFaq(openFaq === i ? null : i)}
								className='w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-primary/5 transition-colors'
							>
								<span className='font-semibold text-primary text-sm md:text-base'>
									{faq.q}
								</span>
								<span
									className={`text-active text-xl font-light ml-4 transition-transform duration-200 ${
										openFaq === i ? 'rotate-45' : ''
									}`}
								>
									+
								</span>
							</button>
							{openFaq === i && (
								<div className='px-6 pb-5'>
									<p className='text-sm text-primary/65 leading-relaxed'>
										{faq.a}
									</p>
								</div>
							)}
						</div>
					))}
				</div>
			</section>
			<footer className='bg-primary text-white py-8'>
				<div className='max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm'>
					<div className='flex items-center gap-3'>
						<span className='font-medium'>
							XCAR Corretora de Seguros <sup>( Segwise )</sup>
						</span>
					</div>
					<p className='max-sm:text-center'>
						© {new Date().getFullYear()} Xcar Corretora de Seguros e
						Empreendimentos Financeiros LTDA. CNPJ 07.581.995/0001-70 | SUSEP
						202055129
					</p>
				</div>
			</footer>
		</div>
	);
}

export default SuportePage;
