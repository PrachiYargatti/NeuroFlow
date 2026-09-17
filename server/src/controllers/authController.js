import { loginUser, registerUser } from '../services/authService.js';

export async function register(req, res) {
  res.status(201).json(await registerUser(req.body));
}

export async function login(req, res) {
  res.json(await loginUser(req.body));
}

export async function me(req, res) {
  res.json({ user: req.user });
}
