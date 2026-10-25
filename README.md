# Meu Site 🚀

Site pessoal/profissional moderno, responsivo e performático.

## 📁 Estrutura do Projeto

```
projeto/
├── index.html          # Página principal
├── .gitignore          # Arquivos ignorados pelo git
├── README.md           # Este arquivo
├── css/
│   └── style.css       # Estilos principais (CSS custom properties, mobile-first)
├── js/
│   └── main.js         # JavaScript modular (ES6+, IIFE modules)
├── assets/
│   ├── images/         # Imagens (otimizadas para web)
│   └── fonts/          # Fontes locais (se necessário)
└── .env/
    └── .env.example    # Exemplo de variáveis de ambiente
```

## 🛠️ Tecnologias

- **HTML5** semântico e acessível
- **CSS3** com Custom Properties (variáveis CSS), Grid, Flexbox
- **JavaScript ES6+** modular (IIFE, Intersection Observer, Fetch API)
- **Mobile-first** responsivo
- **Acessibilidade** (ARIA, foco visível, contraste)

## 🚀 Como rodar

### Opção 1: Live Server (VS Code) - Recomendado
1. Instale a extensão **Live Server** no VS Code
2. Clique com botão direito no `index.html` → "Open with Live Server"

### Opção 2: Python (simples)
```bash
cd D:\projeto
python -m http.server 3000
# Abra http://localhost:3000
```

### Opção 3: Node.js (serve)
```bash
npx serve .
# ou
npm install -g serve && serve .
```

### Opção 4: PHP (se tiver instalado)
```bash
php -S localhost:3000
```

## 📦 Deploy

### Netlify (grátis, drag & drop)
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `projeto` para o painel

### Vercel (grátis)
```bash
npx vercel
```

### GitHub Pages
1. Faça push para um repositório GitHub
2. Settings → Pages → Source: Deploy from branch (main)

## 🎨 Personalização

### Cores (css/style.css)
Edite as variáveis em `:root`:
```css
:root {
    --color-primary: #2563eb;      /* Azul principal */
    --color-secondary: #0f172a;    /* Azul escuro / texto principal */
    --color-accent: #f59e0b;       /* Amarelo/laranja destaque */
    /* ... */
}
```

### Fontes
Troque no `<head>` do `index.html` e no `--font-family` do CSS.

### Conteúdo
Edite o `index.html` com suas informações reais.

## 📱 Responsividade

Breakpoints:
- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: 768px - 1024px
- **Large**: > 1024px

## ♿ Acessibilidade

- HTML semântico
- Contraste AA/AAA
- Foco visível (`:focus-visible`)
- Navegação por teclado
- `alt` em imagens
- Labels em formulários
- `prefers-reduced-motion` respeitado

## 🔧 Scripts Úteis (package.json opcional)

Se quiser usar npm futuramente:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,html",
    "format": "prettier --write ."
  }
}
```

## 📄 Licença

MIT - Sinta-se livre para usar e modificar.

---

Feito com ❤️ e boas práticas modernas.