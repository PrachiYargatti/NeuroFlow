import bcrypt from 'bcryptjs';
import { getRepository } from '../data/repository.js';
import { httpError } from '../utils/httpError.js';
import { signToken } from '../utils/tokens.js';

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw httpError(400, 'Name, email, and password are required');
  }
  if (password.length < 6) {
    throw httpError(400, 'Password must be at least 6 characters');
  }

  const repository = getRepository();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await repository.getOne('users', { email: normalizedEmail });
  if (existing) {
    throw httpError(409, 'Email is already registered');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await repository.create('users', {
    name: name.trim(),
    email: normalizedEmail,
    password: hashed
  });

  return { user: publicUser(user), token: signToken(user) };
}

export async function loginUser({ email, password }) {
  const repository = getRepository();
  const user = await repository.getOne('users', { email: String(email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    throw httpError(401, 'Invalid email or password');
  }

  return { user: publicUser(user), token: signToken(user) };
}
