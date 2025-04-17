import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API] Solicitação de VAPID public key');
  
  try {
    // Utilizar uma variável de ambiente para a chave VAPID pública
    // Isso permite alterar a chave sem precisar recompilar o aplicativo
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
      'BFnrHhwNKc9JZP1QVQGGKr2xSOPVk7Gg54tGg3XSuaTRxJkJ5Ch9M0Ss0u1-iBx9F1i5jJKR_ERTBwmCJbtA3BY';
    
    console.log('[API] VAPID public key fornecida com sucesso');
    
    // Retornar a chave pública VAPID
    return res.status(200).json({
      vapidPublicKey,
    });
  } catch (error: any) {
    console.error('[API] Erro ao fornecer VAPID public key:', error);
    
    return res.status(500).json({
      error: 'Erro ao fornecer VAPID public key',
      message: error.message
    });
  }
} 