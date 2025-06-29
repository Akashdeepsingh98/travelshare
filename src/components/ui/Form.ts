export interface FormFieldProps {
  label: string;
  type: 'text' | 'email' | 'password' | 'url' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  value?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  help?: string;
}

export function createFormField(props: FormFieldProps): HTMLElement {
  const {
    label,
    type,
    placeholder = '',
    value = '',
    required = false,
    options = [],
    rows = 3,
    help
  } = props;
  
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  
  let fieldHTML = `<label class="form-label">${label}${required ? ' *' : ''}</label>`;
  
  switch (type) {
    case 'textarea':
      fieldHTML += `
        <textarea 
          class="form-input" 
          placeholder="${placeholder}" 
          rows="${rows}"
          ${required ? 'required' : ''}
        >${value}</textarea>
      `;
      break;
      
    case 'select':
      fieldHTML += `
        <select class="form-input" ${required ? 'required' : ''}>
          <option value="">${placeholder || 'Select an option...'}</option>
          ${options.map(option => `
            <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
              ${option.label}
            </option>
          `).join('')}
        </select>
      `;
      break;
      
    case 'checkbox':
      fieldHTML += `
        <label class="checkbox-label">
          <input type="checkbox" ${value === 'true' ? 'checked' : ''}>
          <span class="checkbox-custom"></span>
          ${placeholder}
        </label>
      `;
      break;
      
    default:
      fieldHTML += `
        <input 
          type="${type}" 
          class="form-input" 
          placeholder="${placeholder}" 
          value="${value}"
          ${required ? 'required' : ''}
        >
      `;
  }
  
  if (help) {
    fieldHTML += `<small class="form-help">${help}</small>`;
  }
  
  formGroup.innerHTML = fieldHTML;
  return formGroup;
}

export function createForm(fields: FormFieldProps[], onSubmit: (data: FormData) => void): HTMLElement {
  const form = document.createElement('form');
  form.className = 'form';
  
  // Add fields
  fields.forEach(field => {
    form.appendChild(createFormField(field));
  });
  
  // Add error container
  const errorContainer = document.createElement('div');
  errorContainer.className = 'form-error';
  form.appendChild(errorContainer);
  
  // Add submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    onSubmit(formData);
  });
  
  return form;
}

export function showFormError(form: HTMLElement, message: string): void {
  const errorContainer = form.querySelector('.form-error') as HTMLElement;
  if (errorContainer) {
    errorContainer.textContent = message;
  }
}

export function clearFormError(form: HTMLElement): void {
  const errorContainer = form.querySelector('.form-error') as HTMLElement;
  if (errorContainer) {
    errorContainer.textContent = '';
  }
}