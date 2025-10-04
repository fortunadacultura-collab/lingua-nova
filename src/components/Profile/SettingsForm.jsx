import React, { useState, useEffect } from 'react';
import './SettingsForm.css';

const SettingsForm = ({ 
  title, 
  fields, 
  initialData = {}, 
  onSubmit, 
  onCancel,
  onFormChange,
  isLoading = false,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  showCancel = true,
  validationRules = {},
  className = '',
  description,
  validationErrors = {},
  isValidating = false
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.requiredMessage || `${getFieldLabel(name)} é obrigatório`;
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return rules.emailMessage || 'Email inválido';
      }
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLengthMessage || `Mínimo de ${rules.minLength} caracteres`;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `Máximo de ${rules.maxLength} caracteres`;
    }

    // Pattern validation
    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.patternMessage || 'Formato inválido';
    }

    // Custom validation
    if (rules.custom && value) {
      return rules.custom(value, formData) || '';
    }

    return '';
  };

  const getFieldLabel = (name) => {
    const field = fields.find(f => f.name === name);
    return field?.label || name;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const newFormData = {
      ...formData,
      [name]: newValue
    };
    
    setFormData(newFormData);

    // Notify parent of form changes
    if (onFormChange) {
      onFormChange(newFormData, name);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.name, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, field) => ({ ...acc, [field.name]: true }), {}));
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const { name, type, label, placeholder, options, disabled, icon, helper } = field;
    const hasError = touched[name] && errors[name];
    const hasAsyncError = validationErrors[name];
    const isFieldValidating = isValidating && name in validationErrors;
    const fieldId = `field-${name}`;

    const commonProps = {
      id: fieldId,
      name,
      value: formData[name] || '',
      onChange: handleInputChange,
      onBlur: handleBlur,
      disabled: disabled || isLoading || isSubmitting,
      className: `form-input ${hasError ? 'error' : ''} ${icon ? 'with-icon' : ''}`,
      placeholder,
      'aria-describedby': (hasError || hasAsyncError) ? `${fieldId}-error` : (helper ? `${fieldId}-helper` : undefined),
      'aria-invalid': (hasError || hasAsyncError) ? 'true' : 'false',
      'aria-required': validationRules[name]?.required ? 'true' : 'false'
    };

    let inputElement;

    switch (type) {
      case 'textarea':
        inputElement = (
          <textarea
            {...commonProps}
            rows={field.rows || 4}
            className={`form-textarea ${hasError ? 'error' : ''}`}
          />
        );
        break;

      case 'select':
        inputElement = (
          <select {...commonProps} className={`form-select ${hasError ? 'error' : ''}`}>
            <option value="">{placeholder || 'Selecione...'}</option>
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;

      case 'checkbox':
        inputElement = (
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              name={name}
              checked={formData[name] || false}
              onChange={handleInputChange}
              disabled={disabled || isLoading || isSubmitting}
              className="form-checkbox"
            />
            <span className="checkbox-label">{label}</span>
          </label>
        );
        break;

      case 'file':
        inputElement = (
          <div className="file-input-wrapper">
            <input
              {...commonProps}
              type="file"
              accept={field.accept}
              className="form-file-input"
            />
            <label htmlFor={fieldId} className="file-input-label">
              <i className="fas fa-upload"></i>
              {placeholder || 'Escolher arquivo'}
            </label>
          </div>
        );
        break;

      default:
        inputElement = (
          <div className="input-wrapper">
            {icon && <i className={`input-icon ${icon}`}></i>}
            <input
              {...commonProps}
              type={type || 'text'}
            />
            {isFieldValidating && (
              <div className="field-validating">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            )}
          </div>
        );
    }

    if (type === 'checkbox') {
      return (
        <div key={name} className="form-field checkbox-field">
          {inputElement}
          {(hasError || hasAsyncError) && (
          <span 
            id={`${fieldId}-error`} 
            className="field-error" 
            role="alert"
            aria-live="polite"
          >
            {hasError ? errors[name] : hasAsyncError}
          </span>
        )}
        {helper && !(hasError || hasAsyncError) && (
          <span 
            id={`${fieldId}-helper`} 
            className="field-helper"
          >
            {helper}
          </span>
        )}
        </div>
      );
    }

    return (
      <div key={name} className="form-field">
        <label htmlFor={fieldId} className="field-label">
          {label}
          {validationRules[name]?.required && <span className="required">*</span>}
        </label>
        {inputElement}
        {(hasError || hasAsyncError) && (
          <span 
            id={`${fieldId}-error`} 
            className="field-error" 
            role="alert"
            aria-live="polite"
          >
            {hasError ? errors[name] : hasAsyncError}
          </span>
        )}
        {helper && !(hasError || hasAsyncError) && (
          <span 
            id={`${fieldId}-helper`} 
            className="field-helper"
          >
            {helper}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`settings-form ${className}`}>
      {title && <h2 className="form-title">{title}</h2>}
      
      <form onSubmit={handleSubmit} className="form-container" noValidate>
        {description && <p className="form-description">{description}</p>}
        <div className="form-fields">
          {fields.map(renderField)}
        </div>
        
        <div className="form-actions">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
              className="btn btn-secondary"
            >
              {cancelText}
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Salvando...
              </>
            ) : (
              submitText
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;