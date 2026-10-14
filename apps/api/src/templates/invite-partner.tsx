/** @jsxImportSource react */
import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from 'react-email';

interface InvitePartnerEmailProps {
	company: string;
	url: string;
	// Convite da equipe da corretora: saudação e papel; sem eles o texto é o de parceiro.
	name?: string | null;
	roleLabel?: string;
	// Acesso já criado pela corretora: o e-mail só pede para confirmar (sem
	// criação de senha) e o link leva direto ao login.
	confirmOnly?: boolean;
}

function InvitePartnerEmail({
	company,
	url,
	name,
	roleLabel,
	confirmOnly,
}: InvitePartnerEmailProps) {
	const year = new Date().getFullYear();

	return (
		<Html lang="pt-BR">
			<Head />
			<Preview>
				{confirmOnly
					? 'Confirme seu acesso à plataforma Segwise'
					: 'Você foi convidado(a) para a plataforma Segwise'}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={header}>
						<Text style={headerText}>Segwise</Text>
					</Section>
					<Section style={content}>
						<Heading style={greeting}>
							Olá, {name ? name.toUpperCase() : 'NOVO PARCEIRO'}.
						</Heading>
						{confirmOnly ? (
							<>
								<Text style={paragraph}>
									A organização <strong>{company.toUpperCase()}</strong> criou o
									seu acesso à plataforma da <strong>Segwise</strong>.
								</Text>
								<Text style={paragraph}>
									Seu login é este e-mail e a senha foi informada a você
									diretamente pela corretora. Para liberar o acesso, basta
									confirmar abaixo — você será levado(a) à tela de login.
								</Text>
							</>
						) : (
							<>
								<Text style={paragraph}>
									Você foi convidado(a) para fazer parte da plataforma da{' '}
									<strong>Segwise</strong> em nome da organização{' '}
									<strong>{company.toUpperCase()}</strong>
									{roleLabel ? (
										<>
											, com o perfil de <strong>{roleLabel}</strong>
										</>
									) : null}
									.
								</Text>
								<Text style={paragraph}>
									Nossa plataforma foi desenvolvida para simplificar a gestão de
									corretoras de seguros, integrando cotação, emissão e
									acompanhamento de apólices em um só lugar.
								</Text>
							</>
						)}
						<Section style={buttonContainer}>
							<Button style={button} href={url}>
								{confirmOnly ? 'Confirmar acesso' : 'Aceitar convite'}
							</Button>
						</Section>
						<Text style={smallText}>
							Se o botão acima não funcionar, copie e cole o link abaixo no seu
							navegador:
						</Text>
						<Link href={url} style={link}>
							{url}
						</Link>
						<Hr style={hr} />
						<Text style={footnote}>
							Este convite é pessoal e intransferível. Caso não reconheça esta
							solicitação, você pode ignorar este e-mail com segurança.
						</Text>
					</Section>
					<Section style={footer}>
						<Text style={footerText}>
							© {year} Segwise. Todos os direitos reservados.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: '#f4f5f7',
	fontFamily: 'Arial, Helvetica, "Segoe UI", sans-serif',
	padding: '32px 0',
};

const container = {
	backgroundColor: '#ffffff',
	borderRadius: '8px',
	overflow: 'hidden',
	maxWidth: '600px',
	margin: '0 auto',
	boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const header = {
	backgroundColor: '#0f172a',
	padding: '28px 40px',
};

const headerText = {
	color: '#ffffff',
	fontSize: '22px',
	fontWeight: 'bold',
	letterSpacing: '0.5px',
	margin: 0,
};

const content = {
	padding: '40px',
};

const greeting = {
	fontSize: '16px',
	color: '#1e293b',
	margin: '0 0 16px',
	fontWeight: 'normal',
};

const paragraph = {
	fontSize: '15px',
	lineHeight: '1.6',
	color: '#334155',
	margin: '0 0 16px',
};

const buttonContainer = {
	textAlign: 'center' as const,
	margin: '24px 0',
};

const button = {
	backgroundColor: '#2563eb',
	borderRadius: '6px',
	color: '#ffffff',
	fontSize: '15px',
	fontWeight: 'bold',
	textDecoration: 'none',
	padding: '14px 32px',
	display: 'inline-block',
};

const smallText = {
	fontSize: '13px',
	lineHeight: '1.6',
	color: '#64748b',
	margin: '0 0 8px',
};

const link = {
	fontSize: '13px',
	color: '#2563eb',
	wordBreak: 'break-all' as const,
};

const hr = {
	borderColor: '#e2e8f0',
	margin: '24px 0',
};

const footnote = {
	fontSize: '13px',
	lineHeight: '1.6',
	color: '#94a3b8',
	margin: 0,
};

const footer = {
	padding: '24px 40px',
	backgroundColor: '#f8fafc',
	borderTop: '1px solid #e2e8f0',
};

const footerText = {
	fontSize: '12px',
	color: '#94a3b8',
	margin: 0,
};

export { InvitePartnerEmail };
