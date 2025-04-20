import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas permitir solicitações GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Obter a chave pública VAPID do ambiente
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.error('VAPID public key não está configurada nas variáveis de ambiente');
    return res.status(500).json({ error: 'VAPID public key não configurada' });
  }

  // Retornar a chave pública
  return res.status(200).json({ key: vapidPublicKey });
} 