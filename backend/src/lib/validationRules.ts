import { GraphQLError } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';

// Depth limit rule - prevent deeply nested queries
export const depthLimitRule = depthLimit(6);

// Complexity limit rule - prevent expensive queries
export const complexityLimitRule = createComplexityLimitRule(1500);

// Custom validation rule to disable introspection in production
export const noIntrospectionRule = (context: any) => {
  return {
    Field(node: any) {
      if (node.name.value === '__schema' || node.name.value === '__type') {
        if (process.env.NODE_ENV === 'production') {
          throw new GraphQLError('Introspection is disabled in production', {
            nodes: [node],
          });
        }
      }
    },
  };
};

// Custom validation rule to limit query complexity
export const queryComplexityRule = (context: any) => {
  let complexity = 0;
  const maxComplexity = 1000;

  return {
    Field(node: any) {
      // Add complexity based on field type
      if (node.name.value === 'products' || node.name.value === 'searchProducts') {
        complexity += 10; // High complexity for product queries
      } else if (node.name.value === 'reviews' || node.name.value === 'orderItems') {
        complexity += 5; // Medium complexity for nested fields
      } else {
        complexity += 1; // Low complexity for simple fields
      }

      if (complexity > maxComplexity) {
        throw new GraphQLError(
          `Query complexity ${complexity} exceeds maximum allowed complexity of ${maxComplexity}`,
          { nodes: [node] }
        );
      }
    },
  };
};

// Rate limiting validation
export const rateLimitRule = (context: any) => {
  // This would typically integrate with your rate limiting middleware
  // For now, we'll just validate that the request has proper headers
  const request = context.request;
  
  if (!request || !request.headers) {
    throw new GraphQLError('Invalid request headers');
  }

  return {};
};

// All validation rules combined
export const validationRules = [
  depthLimitRule,
  complexityLimitRule,
  noIntrospectionRule,
  queryComplexityRule,
  rateLimitRule,
];
