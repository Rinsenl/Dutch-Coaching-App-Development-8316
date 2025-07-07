// Email service with EmailJS configuration
let emailjs = null;

// Dynamically import EmailJS only when needed
const loadEmailJS = async () => {
  if (!emailjs) {
    try {
      const module = await import('@emailjs/browser');
      emailjs = module.default || module;
      return true;
    } catch (error) {
      console.warn('EmailJS not available:', error);
      return false;
    }
  }
  return true;
};

// Configuration - Updated with your actual EmailJS keys
const EMAILJS_CONFIG = {
  PUBLIC_KEY: '7cr8c6qNUSWfSyoGM',
  SERVICE_ID: 'service_38z6aff',
  TEMPLATE_ID: 'template_ocqztjc'
};

// Check if EmailJS is configured
export const isEmailJSConfigured = () => {
  return EMAILJS_CONFIG.PUBLIC_KEY && 
         EMAILJS_CONFIG.PUBLIC_KEY.trim() !== '' &&
         EMAILJS_CONFIG.SERVICE_ID && 
         EMAILJS_CONFIG.SERVICE_ID.trim() !== '' &&
         EMAILJS_CONFIG.TEMPLATE_ID && 
         EMAILJS_CONFIG.TEMPLATE_ID.trim() !== '';
};

// Main email sending function
export const sendEmail = async (emailSettings, emailData) => {
  try {
    if (!emailSettings.enabled) {
      throw new Error('E-mail verzending is niet ingeschakeld');
    }

    // Check if EmailJS is configured
    if (!isEmailJSConfigured()) {
      // Demo mode - simulate successful email sending
      console.log('Demo mode - Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body.substring(0, 100) + '...'
      });

      return {
        success: true,
        messageId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        note: 'Demo mode - configureer EmailJS voor echte e-mail verzending'
      };
    }

    // Try to load EmailJS
    const emailJSLoaded = await loadEmailJS();
    if (!emailJSLoaded) {
      throw new Error('EmailJS kon niet worden geladen');
    }

    // Initialize EmailJS if not already done
    if (emailjs && typeof emailjs.init === 'function') {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }

    // Prepare template parameters - Fixed: Use correct recipient
    const templateParams = {
      to_email: emailData.to, // This should be the intended recipient
      to_name: emailData.to_name || 'Gebruiker',
      from_name: emailSettings.senderName || 'Coaching App',
      from_email: emailSettings.senderEmail,
      subject: emailData.subject,
      message: emailData.body,
      reply_to: emailSettings.senderEmail
    };

    console.log('Sending email via EmailJS:', {
      service: EMAILJS_CONFIG.SERVICE_ID,
      template: EMAILJS_CONFIG.TEMPLATE_ID,
      to: emailData.to,
      from: emailSettings.senderEmail,
      subject: emailData.subject
    });

    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    console.log('EmailJS response:', response);

    if (response.status === 200) {
      return {
        success: true,
        messageId: response.text || `emailjs_${Date.now()}`,
        timestamp: new Date().toISOString(),
        note: `E-mail succesvol verzonden naar ${emailData.to} via EmailJS`
      };
    } else {
      throw new Error(`EmailJS error: ${response.text || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'E-mail verzending mislukt',
      timestamp: new Date().toISOString()
    };
  }
};

// Validate email settings
export const validateEmailSettings = (settings) => {
  const errors = [];

  if (!settings.senderEmail) {
    errors.push('Verzender e-mailadres is verplicht');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.senderEmail)) {
    errors.push('Ongeldig verzender e-mailadres');
  }

  if (!settings.senderName) {
    errors.push('Verzender naam is verplicht');
  }

  return errors;
};

// Get EmailJS setup instructions
export const getEmailJSSetupInstructions = () => {
  return [
    '✅ EmailJS account aangemaakt',
    '✅ Public Key geconfigureerd: 7cr8c6qNUSWfSyoGM',
    '✅ Service ID geconfigureerd: service_38z6aff', 
    '✅ Template ID geconfigureerd: template_ocqztjc',
    '',
    'Let op: Controleer je EmailJS template configuratie:',
    ' - {{to_email}} - ontvanger e-mailadres',
    ' - {{to_name}} - ontvanger naam',
    ' - {{from_name}} - verzender naam', 
    ' - {{from_email}} - verzender e-mailadres',
    ' - {{subject}} - onderwerp',
    ' - {{message}} - bericht inhoud',
    ' - {{reply_to}} - antwoord adres',
    '',
    'Zorg dat het template correct is ingesteld om naar {{to_email}} te verzenden!'
  ];
};