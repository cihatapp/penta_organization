/**
 * Forms Module
 * Handles form validation, submission, and UI feedback
 */

const FormsManager = (function() {
  'use strict';

  // Configuration
  const config = {
    errorClass: 'form__field--error',
    successClass: 'form__field--success',
    messageClass: 'form__message',
    web3formsApiKey: 'edbe25f9-466d-4a4d-b014-3c4812e2e5d9'
  };

  // Validation patterns
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Turkish phone: supports formats like 545 551 72 50, +90 5XX XXX XX XX, 05XXXXXXXXX
    phone: /^[\+]?[0]?[9]?[0]?[\s\-]?[0-9]{3}[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{2}[\s\-\.]?[0-9]{2}$|^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    name: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s'-]{2,50}$/
  };

  /**
   * Validate a single field
   */
  function validateField(field) {
    const type = field.type;
    const required = field.required;
    const minLength = field.minLength;
    const maxLength = field.maxLength;
    const pattern = field.dataset.pattern;

    let isValid = true;
    let errorMessage = '';

    // Handle checkbox validation separately
    if (type === 'checkbox') {
      if (required && !field.checked) {
        isValid = false;
        errorMessage = getErrorMessage('required', field);
      }
      updateFieldStatus(field, isValid, errorMessage);
      return isValid;
    }

    // Handle file input validation separately
    if (type === 'file') {
      const files = field.files;
      const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes

      // Different allowed types based on field name
      const isContactAttachment = field.name === 'attachment';
      const allowedTypes = isContactAttachment
        ? [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
          ]
        : [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];

      // Required check for file (only if required attribute is set)
      if (required && (!files || files.length === 0)) {
        isValid = false;
        errorMessage = getErrorMessage('fileRequired', field);
      }
      // File size check
      else if (files && files.length > 0) {
        const file = files[0];
        if (file.size > maxFileSize) {
          isValid = false;
          errorMessage = getErrorMessage('fileSize', field, '5MB');
        }
        // File type check
        else if (!allowedTypes.includes(file.type)) {
          isValid = false;
          errorMessage = isContactAttachment
            ? getErrorMessage('fileTypeContact', field)
            : getErrorMessage('fileType', field);
        }
      }

      updateFieldStatus(field, isValid, errorMessage);
      return isValid;
    }

    // Standard text/email/tel input validation
    const value = field.value.trim();

    // Required check
    if (required && !value) {
      isValid = false;
      errorMessage = getErrorMessage('required', field);
    }
    // Email validation
    else if (type === 'email' && value && !patterns.email.test(value)) {
      isValid = false;
      errorMessage = getErrorMessage('email', field);
    }
    // Phone validation
    else if (type === 'tel' && value && !patterns.phone.test(value)) {
      isValid = false;
      errorMessage = getErrorMessage('phone', field);
    }
    // Min length check (minLength returns -1 if not set)
    else if (minLength > 0 && value.length < minLength) {
      isValid = false;
      errorMessage = getErrorMessage('minLength', field, minLength);
    }
    // Max length check (maxLength returns -1 if not set)
    else if (maxLength > 0 && value.length > maxLength) {
      isValid = false;
      errorMessage = getErrorMessage('maxLength', field, maxLength);
    }
    // Custom pattern check
    else if (pattern && value && !new RegExp(pattern).test(value)) {
      isValid = false;
      errorMessage = getErrorMessage('pattern', field);
    }

    updateFieldStatus(field, isValid, errorMessage);
    return isValid;
  }

  /**
   * Get localized error message
   */
  function getErrorMessage(type, field, param = null) {
    const fieldName = field.dataset.fieldName || field.name || 'This field';

    const messages = {
      required: `${fieldName} is required`,
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      minLength: `${fieldName} must be at least ${param} characters`,
      maxLength: `${fieldName} must be no more than ${param} characters`,
      pattern: `Please enter a valid ${fieldName.toLowerCase()}`,
      fileRequired: 'Lütfen bir dosya seçin',
      fileSize: `Dosya boyutu ${param} değerini aşmamalıdır`,
      fileType: 'Sadece PDF, DOC veya DOCX dosyaları kabul edilir',
      fileTypeContact: 'Sadece PDF, DOC, DOCX, JPG, PNG veya GIF dosyaları kabul edilir'
    };

    // Try to get translated message from i18n
    if (typeof I18nManager !== 'undefined') {
      const key = `form.errors.${type}`;
      const translation = I18nManager.getTranslation(key);
      if (translation !== key) {
        return translation.replace('{field}', fieldName).replace('{param}', param);
      }
    }

    return messages[type] || 'Invalid input';
  }

  /**
   * Update field visual status
   */
  function updateFieldStatus(field, isValid, errorMessage = '') {
    // For checkbox, get the parent label or form group
    let wrapper;
    if (field.type === 'checkbox') {
      wrapper = field.closest('.form__group--checkbox') || field.closest('.form__group') || field.parentElement.parentElement;
    } else if (field.type === 'file') {
      wrapper = field.closest('.form__group') || field.parentElement.parentElement;
    } else {
      wrapper = field.closest('.form__group') || field.parentElement;
    }

    if (!wrapper) return;

    // Remove existing status classes
    wrapper.classList.remove(config.errorClass, config.successClass);

    // For file uploads, also update the file-upload label styling
    if (field.type === 'file') {
      const fileUploadLabel = wrapper.querySelector('.file-upload__label');
      if (fileUploadLabel) {
        fileUploadLabel.classList.remove('file-upload__label--error', 'file-upload__label--success');
        if (!isValid) {
          fileUploadLabel.classList.add('file-upload__label--error');
        } else if (field.files && field.files.length > 0) {
          fileUploadLabel.classList.add('file-upload__label--success');
        }
      }
    }

    // Remove existing error message
    const existingError = wrapper.querySelector(`.${config.messageClass}`);
    if (existingError) {
      existingError.remove();
    }

    if (!isValid && errorMessage) {
      wrapper.classList.add(config.errorClass);

      // Create error message element safely
      const errorEl = document.createElement('span');
      errorEl.className = `${config.messageClass} ${config.messageClass}--error`;
      errorEl.textContent = errorMessage;
      wrapper.appendChild(errorEl);

      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', `${field.id}-error`);
      errorEl.id = `${field.id}-error`;
    } else if (isValid) {
      // Check for valid state - different for different field types
      const hasValue = field.type === 'checkbox'
        ? field.checked
        : (field.type === 'file' ? (field.files && field.files.length > 0) : field.value.trim());

      if (hasValue) {
        wrapper.classList.add(config.successClass);
      }
      field.setAttribute('aria-invalid', 'false');
      field.removeAttribute('aria-describedby');
    }
  }

  /**
   * Validate entire form
   */
  function validateForm(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isFormValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  /**
   * Show form message (success/error)
   */
  function showFormMessage(form, type, message) {
    // Remove existing form message
    const existingMessage = form.querySelector('.form__status');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create message element safely
    const messageEl = document.createElement('div');
    messageEl.className = `form__status form__status--${type}`;
    messageEl.setAttribute('role', 'alert');
    messageEl.textContent = message;

    // Insert at the top of the form
    form.insertBefore(messageEl, form.firstChild);

    // Auto-remove after delay
    if (type === 'success') {
      setTimeout(() => {
        messageEl.remove();
      }, 5000);
    }
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e, form) {
    e.preventDefault();

    if (!validateForm(form)) {
      // Focus first invalid field
      const firstError = form.querySelector(`.${config.errorClass} input, .${config.errorClass} textarea`);
      if (firstError) firstError.focus();
      return;
    }

    // Collect form data early for honeypot check
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Honeypot spam protection - if hidden field is filled, silently reject
    // Show fake success to not alert bots they've been detected
    if (data.website && data.website.trim() !== '') {
      const successMsg = typeof I18nManager !== 'undefined'
        ? I18nManager.getTranslation('form.success', 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.')
        : 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.';
      showFormMessage(form, 'success', successMsg);
      form.reset();
      return; // Silently exit without sending
    }

    const submitBtn = form.querySelector('[type="submit"]');

    try {
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        const btnText = submitBtn.querySelector('.btn__text');
        if (btnText) btnText.textContent = 'Gönderiliyor...';
      }

      // Form data already collected above

      // Send form data via Email (pass original FormData for file uploads)
      await sendViaEmail(data, formData);

      // Show success message
      const successMsg = typeof I18nManager !== 'undefined'
        ? I18nManager.getTranslation('form.success', 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.')
        : 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.';

      showFormMessage(form, 'success', successMsg);

      // Reset form
      form.reset();

      // Clear all field statuses
      form.querySelectorAll('.form__group').forEach(group => {
        group.classList.remove(config.errorClass, config.successClass);
        const msg = group.querySelector(`.${config.messageClass}`);
        if (msg) msg.remove();
      });

    } catch (error) {
      console.error('Form submission error:', error);

      const errorMsg = typeof I18nManager !== 'undefined'
        ? I18nManager.getTranslation('form.error', 'Something went wrong. Please try again.')
        : 'Something went wrong. Please try again.';

      showFormMessage(form, 'error', errorMsg);
    } finally {
      // Restore button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        const btnText = submitBtn.querySelector('.btn__text');
        if (btnText) {
          // Get translated text or use default
          const defaultText = typeof I18nManager !== 'undefined'
            ? I18nManager.getTranslation('contact.form.submit', 'Mesaj Gönder')
            : 'Mesaj Gönder';
          btnText.textContent = defaultText;
        }
      }
    }
  }

  /**
   * Service type mapping for better readability
   */
  const serviceLabels = {
    'staff': 'Part Time Ekip Tedariği',
    'event': 'Kurumsal Etkinlik Yönetimi',
    'technical': 'Sahne - Dekor - Ses - Işık',
    'transfer': 'Transfer Hizmeti',
    'decoration': 'Aktivite - Süsleme',
    'other': 'Diğer'
  };

  /**
   * Send form data via Email using Web3Forms
   * Sends form data to the configured email address
   * Supports file attachments for career applications
   */
  async function sendViaEmail(data, originalFormData = null) {
    const serviceName = serviceLabels[data.service] || data.service || 'Belirtilmedi';

    // Check if this is a career application with file upload
    const resumeFile = originalFormData ? originalFormData.get('resume') : null;
    const hasFileUpload = resumeFile && resumeFile instanceof File && resumeFile.size > 0;

    console.log('sendViaEmail called:', { hasFileUpload, fileSize: resumeFile?.size, fileName: resumeFile?.name });

    if (hasFileUpload) {
      // Use FormData for file uploads (multipart/form-data)
      const submitData = new FormData();
      submitData.append('access_key', config.web3formsApiKey);
      submitData.append('subject', `Yeni Kariyer Başvurusu - ${data.fullName || data.name} ${data.surname || ''}`);
      submitData.append('from_name', 'Penta Organizasyon Kariyer');

      // Append all text fields
      submitData.append('Ad', data.fullName || 'Belirtilmedi');
      submitData.append('Soyad', data.surname || 'Belirtilmedi');
      submitData.append('E-posta', data.email || 'Belirtilmedi');
      submitData.append('Telefon', data.phone || 'Belirtilmedi');

      // Append file attachment - Web3Forms requires 'attachment' field name
      submitData.append('attachment', resumeFile, resumeFile.name);

      console.log('Sending career application with file:', resumeFile.name, resumeFile.size, 'bytes');

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: submitData  // FormData - browser sets Content-Type automatically with boundary
        });

        const result = await response.json();
        console.log('Web3Forms response:', result);

        if (!result.success) {
          console.error('Web3Forms error:', result);
          throw new Error(result.message || 'E-posta gönderilemedi');
        }

        return result;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    }

    // Standard JSON submission for contact forms (no files)
    const formDataJson = {
      access_key: config.web3formsApiKey,
      subject: `Yeni İletişim Formu - ${data.name}`,
      from_name: 'Penta Organizasyon Web Sitesi',
      Ad: data.name || 'Belirtilmedi',
      'E-posta': data.email || 'Belirtilmedi',
      Telefon: data.phone || 'Belirtilmedi',
      Hizmet: serviceName,
      Mesaj: data.message || 'Mesaj yok'
    };

    console.log('Sending contact form:', formDataJson);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formDataJson)
    });

    const result = await response.json();
    console.log('Web3Forms response:', result);

    if (!result.success) {
      console.error('Web3Forms error:', result);
      throw new Error(result.message || 'E-posta gönderilemedi');
    }

    return result;
  }

  /**
   * Send form data via WhatsApp
   * Formats form data into a readable message and opens WhatsApp
   */
  function sendViaWhatsApp(data) {
    return new Promise((resolve) => {
      // WhatsApp number (without + sign)
      const phoneNumber = '905309137975';

      // Format the message (using text symbols instead of emojis for better compatibility)
      const serviceName = serviceLabels[data.service] || data.service || 'Belirtilmedi';

      const message = `*YENI ILETISIM FORMU*
------------------------
> *Ad Soyad:* ${data.name || 'Belirtilmedi'}
> *E-posta:* ${data.email || 'Belirtilmedi'}
> *Telefon:* ${data.phone || 'Belirtilmedi'}
> *Hizmet:* ${serviceName}
------------------------
*Mesaj:*
${data.message || 'Mesaj yok'}
------------------------
_${new Date().toLocaleString('tr-TR')}_`;

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message);

      // Create WhatsApp URL
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

      // Open WhatsApp in new tab
      window.open(whatsappURL, '_blank');

      // Resolve after a short delay to show success message
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }

  /**
   * Initialize file upload preview
   */
  function initFileUpload(input) {
    const wrapper = input.closest('.form__group') || input.parentElement.parentElement;
    const preview = input.parentElement.querySelector('.file-upload__preview');
    const fileName = input.parentElement.querySelector('.file-upload__name');
    const originalText = fileName ? fileName.textContent : '';

    input.addEventListener('change', () => {
      const file = input.files[0];

      if (file) {
        if (fileName) {
          // Show filename with size
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          fileName.textContent = `${file.name} (${sizeMB} MB)`;
        }

        // Validate the file immediately
        validateField(input);

        // Image preview
        if (preview && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      } else {
        // Reset to original text if no file selected
        if (fileName) {
          fileName.textContent = originalText;
        }
        // Clear validation state
        if (wrapper) {
          wrapper.classList.remove(config.errorClass, config.successClass);
          const fileUploadLabel = wrapper.querySelector('.file-upload__label');
          if (fileUploadLabel) {
            fileUploadLabel.classList.remove('file-upload__label--error', 'file-upload__label--success');
          }
        }
      }
    });
  }

  /**
   * Initialize character counter
   */
  function initCharCounter(textarea) {
    const maxLength = textarea.maxLength;
    if (!maxLength) return;

    const wrapper = textarea.closest('.form__group') || textarea.parentElement;

    // Create counter element safely
    const counter = document.createElement('span');
    counter.className = 'form__char-counter';
    counter.textContent = `0 / ${maxLength}`;
    wrapper.appendChild(counter);

    textarea.addEventListener('input', () => {
      const current = textarea.value.length;
      counter.textContent = `${current} / ${maxLength}`;

      if (current >= maxLength * 0.9) {
        counter.classList.add('form__char-counter--warning');
      } else {
        counter.classList.remove('form__char-counter--warning');
      }
    });
  }

  /**
   * Initialize forms
   */
  function init() {
    const forms = document.querySelectorAll('[data-form]');

    forms.forEach(form => {
      // Field validation on blur and input
      const fields = form.querySelectorAll('input, textarea, select');
      fields.forEach(field => {
        // Checkbox uses 'change' event
        if (field.type === 'checkbox') {
          field.addEventListener('change', () => validateField(field));
        }
        // File input is handled separately by initFileUpload
        else if (field.type !== 'file') {
          field.addEventListener('blur', () => validateField(field));
          field.addEventListener('input', () => {
            // Clear error on input
            if (field.closest(`.${config.errorClass}`)) {
              validateField(field);
            }
          });
        }
      });

      // Form submission
      form.addEventListener('submit', (e) => handleSubmit(e, form));

      // Reset file upload visual state when form is reset
      form.addEventListener('reset', () => {
        setTimeout(() => {
          // Clear all field statuses after reset
          form.querySelectorAll('.form__group').forEach(group => {
            group.classList.remove(config.errorClass, config.successClass);
            const msg = group.querySelector(`.${config.messageClass}`);
            if (msg) msg.remove();
          });
          // Reset file upload labels
          form.querySelectorAll('.file-upload__label').forEach(label => {
            label.classList.remove('file-upload__label--error', 'file-upload__label--success');
          });
          // Reset file upload names to original
          form.querySelectorAll('.file-upload__name').forEach(nameEl => {
            const originalText = nameEl.getAttribute('data-i18n')
              ? (typeof I18nManager !== 'undefined' ? I18nManager.getTranslation(nameEl.getAttribute('data-i18n')) : 'Yüklemek için tıklayın veya sürükleyin')
              : 'Yüklemek için tıklayın veya sürükleyin';
            nameEl.textContent = originalText;
          });
        }, 0);
      });
    });

    // File uploads
    document.querySelectorAll('.file-upload__input').forEach(initFileUpload);

    // Character counters
    document.querySelectorAll('textarea[maxlength]').forEach(initCharCounter);

    console.log('FormsManager initialized');
  }

  // Public API
  return {
    init,
    validateField,
    validateForm,
    showFormMessage
  };
})();
