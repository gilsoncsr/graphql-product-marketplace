import React, { forwardRef } from 'react';
import { logger } from '@/utils/logger';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  variant = 'default',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      props.onChange?.(event);
    } catch (error) {
      logger.error('Input change error', 'Input', error as Error, { 
        inputId, 
        value: event.target.value 
      });
    }
  };

  const baseClasses = 'input';
  const variantClass = `input--${variant}`;
  const errorClass = hasError ? 'input--error' : '';
  const fullWidthClass = fullWidth ? 'input--full-width' : '';
  const hasLeftIconClass = leftIcon ? 'input--has-left-icon' : '';
  const hasRightIconClass = rightIcon ? 'input--has-right-icon' : '';

  const inputClasses = [
    baseClasses,
    variantClass,
    errorClass,
    fullWidthClass,
    hasLeftIconClass,
    hasRightIconClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {props.required && <span className="input__required">*</span>}
        </label>
      )}
      
      <div className="input__container">
        {leftIcon && (
          <div className="input__left-icon" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          onChange={handleChange}
          {...props}
        />
        
        {rightIcon && (
          <div className="input__right-icon" aria-hidden="true">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <div id={`${inputId}-error`} className="input__error" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${inputId}-helper`} className="input__helper">
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
