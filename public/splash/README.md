# Telas de Splash para iOS

Esta pasta deve conter as imagens de splash para iOS com os seguintes nomes e tamanhos:

- `apple-splash-2048-2732.jpg` - iPad Pro 12.9" (2048x2732)
- `apple-splash-1668-2388.jpg` - iPad Pro 11" (1668x2388)
- `apple-splash-1536-2048.jpg` - iPad Air/Mini (1536x2048)
- `apple-splash-1125-2436.jpg` - iPhone X/XS/11 Pro (1125x2436)
- `apple-splash-1242-2688.jpg` - iPhone XS Max/11 Pro Max (1242x2688)
- `apple-splash-750-1334.jpg` - iPhone 8/SE (750x1334)

## Como gerar as imagens

Você pode gerar essas imagens automaticamente usando ferramentas como:

1. [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
2. [App Icon Generator](https://appicon.co/)

### Exemplo com PWA Asset Generator

```bash
npx pwa-asset-generator ./icon-source.png ./public/splash --splash-only --ios-only
```

## Design recomendado

- Use um fundo que combine com a cor do tema do aplicativo.
- Centralize o logotipo na tela.
- Mantenha o design minimalista para carregamento rápido.
- Use o formato JPG para tamanho menor de arquivo.

A imagem de splash é exibida brevemente quando o usuário inicia o aplicativo PWA no iOS após a instalação na tela inicial. 