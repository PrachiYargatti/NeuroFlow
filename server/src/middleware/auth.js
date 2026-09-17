import { getRepository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';
import { verifyToken } from '../utils/tokens.js';

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw httpError(401, 'Authentication required');
    }

    const payload = verifyToken(token);
    const user = await getRepository().getById('users', payload.sub);
    if (!user) {
      throw httpError(401, 'Invalid token');
    }

    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, 'Invalid token'));
  }
}
