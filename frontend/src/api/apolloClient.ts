import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { logger } from '@/utils/logger';

import { config } from '@/config/env';

// Configuração da URL da API
const API_URL = config.apiUrl;

// Link HTTP
const httpLink = createHttpLink({
  uri: API_URL,
  credentials: 'include', // Para cookies httpOnly
});

// Link de autenticação
const authLink = setContext((_, { headers }) => {
  // Obter token do localStorage se existir
  const token = localStorage.getItem('accessToken');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
});

// Link de tratamento de erros
const errorLink = onError(({ graphQLErrors, networkError, operation }: any) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }: any) => {
      logger.error('GraphQL Error', 'Apollo', new Error(message), {
        message,
        locations,
        path,
        operation: operation.operationName,
      });
    });
  }

  if (networkError) {
    logger.error('Network Error', 'Apollo', networkError, {
      operation: operation.operationName,
      networkError: {
        name: networkError.name,
        message: networkError.message,
        statusCode: (networkError as any).statusCode,
      },
    });

    // Se for erro 401, limpar token e redirecionar para login
    if ((networkError as any).statusCode === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
  }
});

// Cache do Apollo
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        products: {
          keyArgs: ['filter', 'sort'],
          merge(existing, incoming) {
            if (!existing) return incoming;
            if (!incoming) return existing;
            
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            };
          },
        },
        searchProducts: {
          keyArgs: ['query', 'filter', 'sort'],
          merge(existing, incoming) {
            if (!existing) return incoming;
            if (!incoming) return existing;
            
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            };
          },
        },
      },
    },
    User: {
      fields: {
        products: {
          merge(existing, incoming) {
            if (!existing) return incoming;
            if (!incoming) return existing;
            
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
            };
          },
        },
      },
    },
  },
});

// Cliente Apollo
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  // connectToDevTools: import.meta.env.DEV,
});

// Função para limpar cache
export const clearApolloCache = () => {
  apolloClient.clearStore();
  logger.info('Apollo cache cleared', 'Apollo');
};

// Função para refetch queries
export const refetchQueries = async (queryNames: string[]) => {
  try {
    await apolloClient.refetchQueries({
      include: queryNames,
    });
    logger.info('Queries refetched', 'Apollo', { queryNames });
  } catch (error) {
    logger.error('Error refetching queries', 'Apollo', error as Error, { queryNames });
  }
};
