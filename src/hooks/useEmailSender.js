import { useState } from 'react';
import { useData } from '../context/DataContext';
import { sendEmail } from '../services/emailService';

export const useEmailSender = () => {
  const { emailSettings, emailLogs, setEmailLogs } = useData();
  const [isSending, setIsSending] = useState(false);

  const sendOverviewEmail = async (emailData, type = 'overview') => {
    if (!emailSettings.enabled) {
      alert('E-mail verzending is niet ingeschakeld. Neem contact op met de administrator.');
      return false;
    }

    setIsSending(true);
    try {
      const result = await sendEmail(emailSettings, emailData);

      // Log the email attempt
      const logEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: type,
        to: emailData.to,
        subject: emailData.subject,
        success: result.success,
        error: result.error || null,
        messageId: result.messageId || null
      };

      setEmailLogs([logEntry, ...emailLogs]);

      if (result.success) {
        alert('E-mail succesvol verzonden!');
        return true;
      } else {
        alert(`E-mail verzending mislukt: ${result.error}`);
        return false;
      }

    } catch (error) {
      const logEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: type,
        to: emailData.to,
        subject: emailData.subject,
        success: false,
        error: error.message,
        messageId: null
      };

      setEmailLogs([logEntry, ...emailLogs]);
      alert(`E-mail verzending mislukt: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendOverviewEmail,
    isSending,
    emailEnabled: emailSettings.enabled
  };
};