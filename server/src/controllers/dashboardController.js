import { getDashboard } from '../services/dashboardService.js';

export async function showDashboard(req, res) {
  res.json(await getDashboard(req.user.id));
}
