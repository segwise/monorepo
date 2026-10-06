import type { Server } from '@/@types/server';
import { requireSession } from '@/server/middlewares/session';
import { registerRoutersServicesUsersInvitations } from './invitations';
import { registerRoutersServicesUsersList } from './list';
import { registerRoutersServicesUsersRegister } from './register';
import { registerRoutersServicesUsersUpdate } from './update';

function registerRoutersServicesUsers(server: Server) {
	const base = server.basePath('/users');

	base.use(requireSession);

	registerRoutersServicesUsersList(base);
	registerRoutersServicesUsersRegister(base);
	registerRoutersServicesUsersInvitations(base);
	registerRoutersServicesUsersUpdate(base);
}

export { registerRoutersServicesUsers };
