# Frontend - Marketplace GraphQL BFF

Frontend React + TypeScript para o Marketplace GraphQL BFF, desenvolvido com Vite, Apollo Client e SASS.

## 🚀 Tecnologias

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Apollo Client** - Cliente GraphQL
- **React Router** - Roteamento
- **SASS/SCSS** - Pré-processador CSS
- **Jest + RTL** - Testes unitários
- **Cypress** - Testes E2E

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── api/                    # Configuração Apollo Client
│   │   ├── apolloClient.ts     # Cliente GraphQL
│   │   └── queries/            # Queries e Mutations
│   ├── components/             # Componentes reutilizáveis
│   │   └── ui/                 # Design System
│   │       ├── Button/         # Componente Button
│   │       ├── Input/          # Componente Input
│   │       └── Card/           # Componente Card
│   ├── contexts/               # Contextos React
│   │   ├── AuthContext.tsx     # Contexto de autenticação
│   │   └── CartContext.tsx     # Contexto do carrinho
│   ├── pages/                  # Páginas da aplicação
│   │   ├── auth/               # Páginas de autenticação
│   │   │   ├── Login.tsx       # Página de login
│   │   │   └── Register.tsx    # Página de registro
│   │   └── Home.tsx            # Página inicial
│   ├── styles/                 # Estilos globais
│   │   ├── variables.scss      # Variáveis SASS
│   │   └── globals.scss        # Estilos globais
│   ├── utils/                  # Utilitários
│   │   └── logger.ts           # Sistema de logs
│   ├── config/                 # Configurações
│   │   └── env.ts              # Variáveis de ambiente
│   ├── App.tsx                 # Componente principal
│   └── main.tsx                # Ponto de entrada
├── public/                     # Arquivos estáticos
├── dist/                       # Build de produção
└── package.json                # Dependências e scripts
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Gera build de produção
npm run preview      # Preview do build de produção

# Testes
npm run test         # Executa testes unitários
npm run test:watch   # Executa testes em modo watch
npm run test:coverage # Executa testes com cobertura

# E2E
npm run cypress      # Abre Cypress
npm run cypress:run  # Executa testes E2E

# Qualidade
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
npm run audit        # Auditoria de performance
```

## 🎨 Design System

### Componentes UI

- **Button** - Botões com variantes (primary, secondary, outline, ghost, danger)
- **Input** - Campos de entrada com validação e ícones
- **Card** - Cards com variantes (default, elevated, outlined, filled)

### Variáveis SASS

- Cores (primárias, secundárias, status)
- Tipografia (tamanhos, pesos, famílias)
- Espaçamentos (margins, paddings)
- Bordas e sombras
- Breakpoints responsivos

## 🔐 Autenticação

### AuthContext

```typescript
const { 
  user, 
  isAuthenticated, 
  isLoading, 
  login, 
  register, 
  logout 
} = useAuth();
```

### Funcionalidades

- Login com email/senha
- Registro de usuário
- Logout automático
- Refresh token
- Persistência de sessão

## 🛒 Carrinho de Compras

### CartContext

```typescript
const { 
  items, 
  totalItems, 
  totalPrice, 
  addToCart, 
  removeFromCart, 
  updateQuantity 
} = useCart();
```

### Funcionalidades

- Adicionar/remover produtos
- Atualizar quantidades
- Cálculo automático de totais
- Sincronização com backend

## 📊 Sistema de Logs

### Logger

```typescript
import { logger, useLogger } from '@/utils/logger';

// Uso direto
logger.error('Mensagem de erro', 'Contexto', error);

// Hook em componentes
const log = useLogger('Componente');
log.error('Erro no componente', error);
```

### Funcionalidades

- Logs estruturados
- Captura de erros globais
- Logs no terminal do editor
- Diferentes níveis (error, warn, info, debug)

## 🌐 Integração GraphQL

### Apollo Client

- Cache inteligente
- Tratamento de erros
- Autenticação automática
- Paginação
- Fragments reutilizáveis

### Queries Principais

- `ME_QUERY` - Dados do usuário
- `PRODUCTS_QUERY` - Lista de produtos
- `PRODUCT_QUERY` - Detalhes do produto
- `CART_QUERY` - Itens do carrinho
- `ORDERS_QUERY` - Pedidos do usuário

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- Backend GraphQL rodando na porta 4000

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Criar arquivo .env na raiz do projeto
VITE_API_URL=http://localhost:4000/graphql

# Iniciar desenvolvimento
npm run dev
```

### Acesso

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## 🧪 Testes

### Testes Unitários

```bash
npm run test
```

### Testes E2E

```bash
npm run cypress
```

### Cobertura

```bash
npm run test:coverage
```

## 📱 Responsividade

- Mobile First
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid system flexível
- Componentes adaptativos

## ♿ Acessibilidade

- Navegação por teclado
- ARIA labels
- Contraste adequado
- Screen reader friendly
- Focus management

## 🎯 Performance

- Code splitting
- Lazy loading
- Otimização de imagens
- Bundle analysis
- Lighthouse score > 90

## 🔧 Configuração

### Vite

- Path aliases (@/)
- SASS preprocessing
- Source maps
- Hot reload

### TypeScript

- Strict mode
- Path mapping
- Type checking
- No unused locals/parameters

## 📝 Logs e Debugging

### Terminal

Todos os erros e logs aparecem no terminal do editor, facilitando o debugging:

```bash
[2024-01-01T10:00:00.000Z] ERROR [Auth] Login failed: Invalid credentials
[2024-01-01T10:00:01.000Z] INFO [Cart] Item added to cart: { productId: "123", quantity: 2 }
```

### Browser DevTools

- Apollo Client DevTools
- React DevTools
- Network tab para GraphQL
- Console para logs do browser

## 🚀 Deploy

### Build de Produção

```bash
npm run build
```

### Variáveis de Ambiente

```bash
VITE_API_URL=https://api.marketplace.com/graphql
```

### Servidor Web

- Nginx
- Apache
- Vercel
- Netlify

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para o Marketplace GraphQL BFF**