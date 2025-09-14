import React from 'react';
import { logger } from '@/utils/logger';
import './Card.scss';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  'data-testid'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  onClick,
  'data-testid': testId,
}) => {
  const handleClick = () => {
    if (!clickable || !onClick) return;

    try {
      onClick();
    } catch (error) {
      logger.error('Card click error', 'Card', error as Error, { variant, padding });
    }
  };

  const baseClasses = 'card';
  const variantClass = `card--${variant}`;
  const paddingClass = `card--padding-${padding}`;
  const hoverClass = hover ? 'card--hover' : '';
  const clickableClass = clickable ? 'card--clickable' : '';

  const classes = [
    baseClasses,
    variantClass,
    paddingClass,
    hoverClass,
    clickableClass,
    className,
  ].filter(Boolean).join(' ');

  const Component = clickable ? 'button' : 'div';

  return (
    <Component
      className={classes}
      onClick={handleClick}
      data-testid={testId}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </Component>
  );
};
